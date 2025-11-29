import { useState } from 'react'
import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore'
import type { CalculationResult, CalculationType, Purchase, UserShare } from '../../../model/calculateModel'
import { db } from '../../../firebase'
import Swal from 'sweetalert2'

const useMainController = () => {
  const [totalAmount, setTotalAmount] = useState<string>('')
  const [userAmount, setUserAmount] = useState<string>('')
  const [calculationType, setCalculationType] = useState<CalculationType>('divide')
  const [result, setResult] = useState<CalculationResult | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')

  // Split users state
  const [totalUsers, setTotalUsers] = useState<string>('')
  const [userNames, setUserNames] = useState<string[]>([])
  const [users, setUsers] = useState<UserShare[]>([])
  const [currentSplitId, setCurrentSplitId] = useState<string | null>(null)
  const [step, setStep] = useState<'setup' | 'calculate'>('setup')

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

  const startCalculation = () => {
    const totalNum = parseFloat(totalAmount)
    const usersNum = parseInt(totalUsers)

    if (isNaN(totalNum) || totalNum <= 0) {
      Swal.fire({
        icon: 'error',
        title: 'ຂໍ້ຜິດພາດ',
        text: 'ກະລຸນາປ້ອນຈຳນວນເງິນທີ່ຖືກຕ້ອງ',
        confirmButtonText: 'ຕົກລົງ'
      })
      return
    }

    if (isNaN(usersNum) || usersNum <= 0) {
      Swal.fire({
        icon: 'error',
        title: 'ຂໍ້ຜິດພາດ',
        text: 'ກະລຸນາປ້ອນຈຳນວນຜູ້ໃຊ້ທີ່ຖືກຕ້ອງ',
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

    const perUserAmount = totalNum / usersNum

    const newUsers: UserShare[] = userNames.map((name, index) => ({
      userId: `user_${index + 1}`,
      userName: name.trim(),
      initialShare: perUserAmount,
      currentBalance: perUserAmount,
      purchases: []
    }))

    setUsers(newUsers)
    setStep('calculate')
    setError('')
  }

  const backToSetup = () => {
    setStep('setup')
    setUsers([])
  }

  const addPurchase = async (userIndex: number, itemName: string, amount: number) => {
    if (amount <= 0) {
      Swal.fire({
        icon: 'error',
        title: 'ຂໍ້ຜິດພາດ',
        text: 'ຈຳນວນເງິນຕ້ອງຫຼາຍກວ່າ 0',
        confirmButtonText: 'ຕົກລົງ'
      })
      return
    }

    const user = users[userIndex]
    if (amount > user.currentBalance) {
      Swal.fire({
        icon: 'error',
        title: 'ຂໍ້ຜິດພາດ',
        text: `${user.userName} ມີເງິນບໍ່ພໍ`,
        confirmButtonText: 'ຕົກລົງ'
      })
      return
    }

    const newPurchase: Purchase = {
      id: `purchase_${Date.now()}`,
      itemName,
      amount,
      timestamp: new Date() as any
    }

    const updatedUsers = [...users]
    updatedUsers[userIndex] = {
      ...user,
      currentBalance: user.currentBalance - amount,
      purchases: [...user.purchases, newPurchase]
    }

    setUsers(updatedUsers)
    setError('')

    // Show success message
    await Swal.fire({
      icon: 'success',
      title: 'ສຳເລັດ',
      text: 'ເພີ່ມລາຍການຊື້ສຳເລັດແລ້ວ',
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
      const docRef = await addDoc(collection(db, 'user_splits'), {
        totalAmount: parseFloat(totalAmount),
        totalUsers: users.length,
        perUserAmount: users[0].initialShare,
        users: users,
        timestamp: serverTimestamp(),
        calculationType: 'split_users'
      })

      setCurrentSplitId(docRef.id)
      
      await Swal.fire({
        icon: 'success',
        title: 'ສຳເລັດ',
        text: 'ບັນທຶກການແບ່ງຜູ້ໃຊ້ສຳເລັດແລ້ວ',
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
        userId: 'anonymous',
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
    totalUsers,
    userNames,
    users,
    step,
    handleTotalAmountChange,
    handleUserAmountChange,
    handleCalculationTypeChange,
    handleTotalUsersChange,
    handleUserNameChange,
    startCalculation,
    backToSetup,
    addPurchase,
    saveSplitToFirebase,
    saveToHistory,
    clearCalculation,
    getFormulaDescription
  }
}

export default useMainController