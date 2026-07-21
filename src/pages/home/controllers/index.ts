import { useState } from 'react'
import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore'
import type { CalculationResult, CalculationType, Purchase, UserShare } from '../../../model/calculateModel'
import { db } from '../../../firebase'
import Swal from 'sweetalert2'
import {
  computeUserTotals,
  calculateSettlements as calcSettlements,
  type Settlement,
} from '../../../utils/splitCalculations'
import useAuth from '../../../context/auth'

export type { Settlement }

const useMainController = () => {
  const { user } = useAuth()
  const [totalAmount, setTotalAmount] = useState<string>('')
  const [userAmount, setUserAmount] = useState<string>('')
  const [calculationType, setCalculationType] = useState<CalculationType>('divide')
  const [result, setResult] = useState<CalculationResult | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')

  // Split users state
  const [tripName, setTripName] = useState<string>('')
  const [totalUsers, setTotalUsers] = useState<string>('')
  const [userNames, setUserNames] = useState<string[]>([])
  const [users, setUsers] = useState<UserShare[]>([])
  const [currentSplitId, setCurrentSplitId] = useState<string | null>(null)
  const [step, setStep] = useState<'setup' | 'expenses'>('setup')

  const handleTripNameChange = (value: string) => {
    setTripName(value)
  }

  const handleTotalAmountChange = (value: string) => {
    setTotalAmount(value)
    if (calculationType !== 'split_users') {
      calculateAuto(value, userAmount)
    }
  }

  const handleUserAmountChange = (value: string) => {
    setUserAmount(value)
    calculateAuto(totalAmount, value)
  }

  const handleCalculationTypeChange = (type: CalculationType) => {
    setCalculationType(type)
    if (type === 'split_users') {
      setResult(null)
      setStep('setup')
    } else {
      calculateAuto(totalAmount, userAmount, type)
    }
  }

  const handleTotalUsersChange = (value: string) => {
    setTotalUsers(value)
    const num = parseInt(value)
    if (!isNaN(num) && num > 0) {
      setUserNames(Array(num).fill(''))
    } else {
      setUserNames([])
    }
  }

  const handleUserNameChange = (index: number, name: string) => {
    const newNames = [...userNames]
    newNames[index] = name
    setUserNames(newNames)
  }

  // Setup -> Expenses: only the number of people (and their names) is required.
  // The total amount and each person's fair share are derived later from the
  // expenses that get logged on the expenses page.
  const proceedToExpenses = () => {
    const usersNum = parseInt(totalUsers)

    if (isNaN(usersNum) || usersNum <= 0) {
      Swal.fire({
        icon: 'error',
        title: 'ຂໍ້ຜິດພາດ',
        text: 'ກະລຸນາປ້ອນຈຳນວນຄົນທີ່ຖືກຕ້ອງ',
        confirmButtonText: 'ຕົກລົງ'
      })
      return
    }

    const hasEmptyNames = userNames.some(name => !name.trim())
    if (hasEmptyNames) {
      Swal.fire({
        icon: 'warning',
        title: 'ແຈ້ງເຕືອນ',
        text: 'ກະລຸນາປ້ອນຊື່ຜູ້ໃຊ້ທັງໝົດ',
        confirmButtonText: 'ຕົກລົງ'
      })
      return
    }

    const newUsers: UserShare[] = userNames.map((name, index) => ({
      userId: `user_${index + 1}`,
      userName: name.trim(),
      initialShare: 0,
      currentBalance: 0,
      purchases: []
    }))

    setUsers(newUsers)
    setStep('expenses')
    setError('')
  }

  const backToSetup = () => {
    setStep('setup')
    setUsers([])
  }

  // Calculate settlements - who owes whom (shared pure util)
  const calculateSettlements = (): Settlement[] => calcSettlements(users)

  const addPurchase = async (
    userIndex: number,
    itemName: string,
    amount: number,
    consumers: string[]
  ) => {
    if (amount <= 0) {
      Swal.fire({
        icon: 'error',
        title: 'ຂໍ້ຜິດພາດ',
        text: 'ຈຳນວນເງິນຕ້ອງຫຼາຍກວ່າ 0',
        confirmButtonText: 'ຕົກລົງ'
      })
      return
    }

    if (!consumers || consumers.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'ແຈ້ງເຕືອນ',
        text: 'ກະລຸນາເລືອກຢ່າງໜ້ອຍ 1 ຄົນທີ່ຮ່ວມໃຊ້ລາຍການນີ້',
        confirmButtonText: 'ຕົກລົງ'
      })
      return
    }

    const user = users[userIndex]

    const newPurchase: Purchase = {
      id: `purchase_${Date.now()}`,
      itemName,
      amount,
      consumers,
      timestamp: new Date() as any
    }

    const usersWithNewPurchase = [...users]
    usersWithNewPurchase[userIndex] = {
      ...user,
      purchases: [...user.purchases, newPurchase]
    }

    // Recalculate everyone's paid/consumed/balance from all itemised purchases
    const updatedUsers = computeUserTotals(usersWithNewPurchase)

    setUsers(updatedUsers)
    setError('')

    // Show success message with appropriate info
    const newBalance = updatedUsers[userIndex].currentBalance
    let message = 'ເພີ່ມລາຍຈ່າຍສຳເລັດແລ້ວ'

    // If balance is negative, user should receive money back
    if (newBalance < 0) {
      const amountToReceive = Math.abs(newBalance)
      message = `${user.userName} ຈ່າຍເກີນສ່ວນແບ່ງ, ຄວນໄດ້ຮັບເງິນຄືນ ${amountToReceive.toLocaleString()} ກີບ`
    }

    await Swal.fire({
      icon: 'success',
      title: 'ສຳເລັດ',
      text: message,
      confirmButtonText: 'ຕົກລົງ'
    })

    if (currentSplitId) {
      try {
        await updateDoc(doc(db, 'user_splits', currentSplitId), {
          users: updatedUsers
        })
      } catch (err) {
        console.error('Error updating purchase:', err)
      }
    }
  }

  const editPurchase = async (
    userIndex: number,
    purchaseId: string,
    itemName: string,
    amount: number,
    consumers: string[]
  ) => {
    if (amount <= 0) {
      Swal.fire({
        icon: 'error',
        title: 'ຂໍ້ຜິດພາດ',
        text: 'ຈຳນວນເງິນຕ້ອງຫຼາຍກວ່າ 0',
        confirmButtonText: 'ຕົກລົງ'
      })
      return
    }

    if (!consumers || consumers.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'ແຈ້ງເຕືອນ',
        text: 'ກະລຸນາເລືອກຢ່າງໜ້ອຍ 1 ຄົນທີ່ຮ່ວມໃຊ້ລາຍການນີ້',
        confirmButtonText: 'ຕົກລົງ'
      })
      return
    }

    const usersWithEditedPurchase = users.map((user, idx) => {
      if (idx !== userIndex) return user
      return {
        ...user,
        purchases: user.purchases.map((p) =>
          p.id === purchaseId
            ? { ...p, itemName, amount, consumers }
            : p
        )
      }
    })

    const updatedUsers = computeUserTotals(usersWithEditedPurchase)
    setUsers(updatedUsers)

    await Swal.fire({
      icon: 'success',
      title: 'ສຳເລັດ',
      text: 'ແກ້ໄຂລາຍຈ່າຍສຳເລັດແລ້ວ',
      confirmButtonText: 'ຕົກລົງ',
      timer: 1500,
      showConfirmButton: false
    })

    if (currentSplitId) {
      try {
        await updateDoc(doc(db, 'user_splits', currentSplitId), {
          users: updatedUsers
        })
      } catch (err) {
        console.error('Error updating purchase:', err)
      }
    }
  }

  const deletePurchase = async (userIndex: number, purchaseId: string) => {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'ຢືນຢັນການລຶບ',
      text: 'ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການລຶບລາຍຈ່າຍນີ້?',
      showCancelButton: true,
      confirmButtonText: 'ລຶບ',
      cancelButtonText: 'ຍົກເລີກ',
      confirmButtonColor: '#d33'
    })

    if (!result.isConfirmed) return

    const usersWithDeletedPurchase = users.map((user, idx) => {
      if (idx !== userIndex) return user
      return {
        ...user,
        purchases: user.purchases.filter((p) => p.id !== purchaseId)
      }
    })

    const updatedUsers = computeUserTotals(usersWithDeletedPurchase)
    setUsers(updatedUsers)

    if (currentSplitId) {
      try {
        await updateDoc(doc(db, 'user_splits', currentSplitId), {
          users: updatedUsers
        })
      } catch (err) {
        console.error('Error deleting purchase:', err)
      }
    }
  }

  const saveSplitToFirebase = async () => {
    if (users.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'ແຈ້ງເຕືອນ',
        text: 'ບໍ່ມີຂໍ້ມູນຜູ້ໃຊ້ທີ່ຈະບັນທຶກ',
        confirmButtonText: 'ຕົກລົງ'
      })
      return
    }

    setLoading(true)
    try {
      const settlements = calculateSettlements()
      const computedTotalAmount = users.reduce(
        (sum, u) => sum + u.purchases.reduce((s, p) => s + p.amount, 0),
        0
      )
      const perUserAmount = computedTotalAmount / users.length

      const docRef = await addDoc(collection(db, 'user_splits'), {
        tripName: tripName.trim(),
        userId: user?.uid ?? 'anonymous',
        userEmail: user?.email ?? '',
        userName: user?.displayName ?? user?.email ?? '',
        totalAmount: computedTotalAmount,
        totalUsers: users.length,
        perUserAmount,
        users: users,
        settlements: settlements,
        timestamp: serverTimestamp(),
        calculationType: 'split_users',
        memberEmails: [] // Initialize empty array for sharing
      })

      setCurrentSplitId(docRef.id)
      
      await Swal.fire({
        icon: 'success',
        title: 'ສຳເລັດ',
        text: 'ບັນທຶກການຫານກັບໝູ່ສຳເລັດແລ້ວ',
        confirmButtonText: 'ຕົກລົງ'
      })
    } catch (err) {
      console.error('Error saving to Firebase:', err)
      await Swal.fire({
        icon: 'error',
        title: 'ຂໍ້ຜິດພາດ',
        text: 'ບໍ່ສາມາດບັນທຶກຂໍ້ມູນໄດ້',
        confirmButtonText: 'ຕົກລົງ'
      })
    } finally {
      setLoading(false)
    }
  }

  const calculateAuto = (total: string, user: string, type: CalculationType = calculationType) => {
    const totalNum = parseFloat(total)
    const userNum = parseFloat(user)

    if (isNaN(totalNum) || isNaN(userNum) || totalNum <= 0 || userNum <= 0) {
      setResult(null)
      setError('')
      return
    }

    if (userNum > totalNum) {
      setError('ຈຳນວນຄົນບໍ່ສາມາດຫຼາຍກວ່າຈຳນວນເງິນທັງໝົດ')
      setResult(null)
      return
    }

    setError('')

    let calculatedResult: number
    let percentage: number
    let remaining: number

    switch (type) {
      case 'divide':
        calculatedResult = totalNum / userNum
        percentage = (userNum / totalNum) * 100
        remaining = totalNum - userNum
        break
      
      case 'percentage':
        percentage = (userNum / totalNum) * 100
        calculatedResult = percentage
        remaining = totalNum - userNum
        break
      
      case 'subtract':
        calculatedResult = totalNum - userNum
        percentage = (userNum / totalNum) * 100
        remaining = calculatedResult
        break
      
      default:
        calculatedResult = 0
        percentage = 0
        remaining = 0
    }

    setResult({
      totalAmount: totalNum,
      userAmount: userNum,
      result: calculatedResult,
      percentage,
      remaining
    })
  }

  const saveToHistory = async () => {
    if (!result) {
      Swal.fire({
        icon: 'warning',
        title: 'ແຈ້ງເຕືອນ',
        text: 'ບໍ່ມີຂໍ້ມູນການຄິດໄລ່ທີ່ຈະບັນທຶກ',
        confirmButtonText: 'ຕົກລົງ'
      })
      return
    }

    setLoading(true)
    try {
      await addDoc(collection(db, 'calculation_history'), {
        userId: user?.uid ?? 'anonymous',
        userEmail: user?.email ?? '',
        userName: user?.displayName ?? user?.email ?? '',
        totalAmount: result.totalAmount,
        userAmount: result.userAmount,
        result: result.result,
        percentage: result.percentage,
        remaining: result.remaining,
        calculationType: calculationType,
        timestamp: serverTimestamp(),
        details: {
          type: calculationType,
          formula: getFormulaDescription()
        }
      })
      
      await Swal.fire({
        icon: 'success',
        title: 'ສຳເລັດ',
        text: 'ບັນທຶກການຄິດໄລ່ສຳເລັດແລ້ວ',
        confirmButtonText: 'ຕົກລົງ'
      })
    } catch (err) {
      console.error('Error saving to Firebase:', err)
      await Swal.fire({
        icon: 'error',
        title: 'ຂໍ້ຜິດພາດ',
        text: 'ບໍ່ສາມາດບັນທຶກຂໍ້ມູນໄດ້',
        confirmButtonText: 'ຕົກລົງ'
      })
    } finally {
      setLoading(false)
    }
  }

  const getFormulaDescription = (): string => {
    switch (calculationType) {
      case 'divide':
        return `${totalAmount} ÷ ${userAmount} = ${result?.result.toFixed(2)}`
      case 'percentage':
        return `(${userAmount} ÷ ${totalAmount}) × 100 = ${result?.result.toFixed(2)}%`
      case 'subtract':
        return `${totalAmount} - ${userAmount} = ${result?.result.toFixed(2)}`
      default:
        return ''
    }
  }

  const clearCalculation = () => {
    setTotalAmount('')
    setUserAmount('')
    setTripName('')
    setTotalUsers('')
    setUserNames([])
    setUsers([])
    setResult(null)
    setError('')
    setCurrentSplitId(null)
    setStep('setup')
  }

  return {
    totalAmount,
    userAmount,
    calculationType,
    result,
    loading,
    error,
    tripName,
    totalUsers,
    userNames,
    users,
    step,
    handleTotalAmountChange,
    handleUserAmountChange,
    handleCalculationTypeChange,
    handleTripNameChange,
    handleTotalUsersChange,
    handleUserNameChange,
    proceedToExpenses,
    backToSetup,
    addPurchase,
    editPurchase,
    deletePurchase,
    saveSplitToFirebase,
    saveToHistory,
    clearCalculation,
    getFormulaDescription,
    calculateSettlements // Export this function
  }
}

export default useMainController