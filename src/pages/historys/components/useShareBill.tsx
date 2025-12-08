import { useRef } from 'react'
import html2canvas from 'html2canvas'
import Swal from 'sweetalert2'

interface Settlement {
  from: string
  to: string
  amount: number
}

const calculateSettlements = (users: any[]): Settlement[] => {
  if (users.length === 0) return []

  const creditors = users
    .filter((u) => u.currentBalance < 0)
    .map((u) => ({
      userName: u.userName,
      amount: Math.abs(u.currentBalance),
    }))

  const debtors = users
    .filter((u) => u.currentBalance > 0)
    .map((u) => ({
      userName: u.userName,
      amount: u.currentBalance,
    }))

  const settlements: Settlement[] = []
  let i = 0, j = 0

  while (i < creditors.length && j < debtors.length) {
    const creditor = creditors[i]
    const debtor = debtors[j]
    const settleAmount = Math.min(creditor.amount, debtor.amount)

    if (settleAmount > 0.01) {
      settlements.push({
        from: debtor.userName,
        to: creditor.userName,
        amount: settleAmount,
      })
    }

    creditor.amount -= settleAmount
    debtor.amount -= settleAmount

    if (creditor.amount < 0.01) i++
    if (debtor.amount < 0.01) j++
  }

  return settlements
}

const useShareableBill = () => {
  const billRef = useRef<HTMLDivElement>(null)

  const generateBillHTML = (splitData: any): string => {
    const settlements = calculateSettlements(splitData.users)
    const formatLaoKip = (amount: number) => amount.toLocaleString('lo-LA')

    return `
      <div style="font-family: 'Noto Sans Lao', sans-serif; background: white; padding: 32px; max-width: 600px; margin: 0 auto;">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="font-size: 48px; margin-bottom: 8px;">🧾</div>
          <h1 style="font-size: 32px; font-weight: bold; margin: 8px 0;">ໃບບິນແບ່ງເງິນ</h1>
          <p style="color: #666; font-size: 14px;">ວັນທີ່: ${new Date(splitData.timestamp?.seconds * 1000 || Date.now()).toLocaleDateString('lo-LA')}</p>
        </div>

        <hr style="border: none; border-top: 2px solid #ddd; margin: 24px 0;">

        <!-- Summary -->
        <div style="background: #e3f2fd; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="font-weight: bold;">ຈຳນວນເງິນທັງໝົດ:</span>
            <span style="font-size: 20px; font-weight: bold;">${formatLaoKip(splitData.totalAmount)} ກີບ</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span style="font-size: 14px;">ຈຳນວນຄົນ:</span>
            <span style="font-size: 14px;">${splitData.totalUsers} ຄົນ</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="font-size: 14px;">ຕໍ່ຄົນ:</span>
            <span style="font-size: 14px; font-weight: 500;">${formatLaoKip(splitData.perUserAmount)} ກີບ</span>
          </div>
        </div>

        <!-- Users -->
        <h2 style="font-size: 18px; font-weight: bold; margin-bottom: 16px;">ລາຍລະອຽດການໃຊ້ຈ່າຍ</h2>
        
        ${splitData.users.map((user: any, index: number) => {
          const totalSpent = user.initialShare - user.currentBalance
          const shouldReceive = user.currentBalance < 0
          const shouldPay = user.currentBalance > 0

          return `
            <div style="border: ${shouldReceive ? '2px solid #4caf50' : '1px solid #ddd'}; padding: 16px; border-radius: 8px; margin-bottom: 16px; background: ${shouldReceive ? '#f1f8f4' : 'white'};">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <span style="font-weight: bold; font-size: 16px;">${index + 1}. ${user.userName}</span>
                ${shouldReceive ? '<span style="background: #4caf50; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">ຄວນໄດ້ຮັບເງິນຄືນ</span>' : ''}
                ${shouldPay ? '<span style="background: #ff9800; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">ຕ້ອງຈ່າຍ</span>' : ''}
              </div>

              ${user.purchases.length > 0 ? `
                <div style="margin: 8px 0 8px 16px;">
                  ${user.purchases.map((p: any) => `
                    <div style="display: flex; justify-content: space-between; padding: 4px 0;">
                      <span style="font-size: 14px;">• ${p.itemName}</span>
                      <span style="font-size: 14px; color: #d32f2f;">${formatLaoKip(p.amount)} ກີບ</span>
                    </div>
                  `).join('')}
                </div>
              ` : ''}

              <hr style="border: none; border-top: 1px solid #ddd; margin: 8px 0;">

              <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <span style="font-size: 14px;">ຊື້ທັງໝົດ:</span>
                <span style="font-size: 14px; font-weight: 500;">${formatLaoKip(totalSpent)} ກີບ</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="font-size: 14px; font-weight: bold;">${shouldReceive ? 'ຄວນໄດ້ຮັບຄືນ:' : shouldPay ? 'ຍັງຕ້ອງຈ່າຍ:' : 'ສະຖານະ:'}</span>
                <span style="font-size: 14px; font-weight: bold; color: ${shouldReceive ? '#4caf50' : shouldPay ? '#ff9800' : '#000'};">
                  ${formatLaoKip(Math.abs(user.currentBalance))} ກີບ
                </span>
              </div>
            </div>
          `
        }).join('')}

        ${settlements.length > 0 ? `
          <hr style="border: none; border-top: 2px solid #ddd; margin: 24px 0;">
          
          <h2 style="font-size: 18px; font-weight: bold; margin-bottom: 16px;">ການໂອນເງິນທີ່ຕ້ອງເຮັດ</h2>
          
          ${settlements.map((s: Settlement) => `
            <div style="background: #e3f2fd; padding: 12px; border-radius: 8px; margin-bottom: 8px; border-left: 4px solid #2196f3;">
              <span style="font-size: 14px;">
                <strong>${s.from}</strong> ຕ້ອງຈ່າຍໃຫ້ <strong>${s.to}</strong>: 
                <strong style="color: #1976d2;">${formatLaoKip(s.amount)} ກີບ</strong>
              </span>
            </div>
          `).join('')}
        ` : ''}

        <!-- Footer -->
        <div style="margin-top: 32px; padding-top: 16px; border-top: 2px dashed #ddd; text-align: center;">
          <p style="font-size: 12px; color: #999;">ສ້າງໂດຍ Smart Calculator • ${new Date().toLocaleDateString('lo-LA')}</p>
        </div>
      </div>
    `
  }

  const shareBill = async (splitData: any) => {
    try {
      // Create temporary container
      const container = document.createElement('div')
      container.innerHTML = generateBillHTML(splitData)
      container.style.position = 'absolute'
      container.style.left = '-9999px'
      document.body.appendChild(container)

      // Generate image
      const canvas = await html2canvas(container, {
        backgroundColor: '#ffffff',
        scale: 2,
      })

      document.body.removeChild(container)

      // Convert to blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b!), 'image/png')
      })

      const file = new File([blob], `bill-${Date.now()}.png`, { type: 'image/png' })

      // Try native share API
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'ໃບບິນແບ່ງເງິນ',
          text: 'ໃບບິນການແບ່ງເງິນຈາກ Smart Calculator',
          files: [file],
        })
        
        await Swal.fire({
          icon: 'success',
          title: 'ສຳເລັດ',
          text: 'ແບ່ງປັນໃບບິນສຳເລັດແລ້ວ',
          timer: 1500,
          showConfirmButton: false,
        })
      } else {
        // Fallback: download
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `bill-${Date.now()}.png`
        a.click()
        URL.revokeObjectURL(url)

        await Swal.fire({
          icon: 'success',
          title: 'ສຳເລັດ',
          text: 'ດາວໂຫຼດໃບບິນສຳເລັດແລ້ວ',
          timer: 1500,
          showConfirmButton: false,
        })
      }
    } catch (error) {
      console.error('Error sharing bill:', error)
      await Swal.fire({
        icon: 'error',
        title: 'ຂໍ້ຜິດພາດ',
        text: 'ບໍ່ສາມາດແບ່ງປັນໃບບິນໄດ້',
        confirmButtonText: 'ຕົກລົງ',
      })
    }
  }

  const downloadBill = async (splitData: any) => {
    try {
      const container = document.createElement('div')
      container.innerHTML = generateBillHTML(splitData)
      container.style.position = 'absolute'
      container.style.left = '-9999px'
      document.body.appendChild(container)

      const canvas = await html2canvas(container, {
        backgroundColor: '#ffffff',
        scale: 2,
      })

      document.body.removeChild(container)

      canvas.toBlob((blob) => {
        if (!blob) return
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `bill-${Date.now()}.png`
        a.click()
        URL.revokeObjectURL(url)
      })

      await Swal.fire({
        icon: 'success',
        title: 'ສຳເລັດ',
        text: 'ດາວໂຫຼດໃບບິນສຳເລັດແລ້ວ',
        timer: 1500,
        showConfirmButton: false,
      })
    } catch (error) {
      console.error('Error downloading bill:', error)
      await Swal.fire({
        icon: 'error',
        title: 'ຂໍ້ຜິດພາດ',
        text: 'ບໍ່ສາມາດດາວໂຫຼດໃບບິນໄດ້',
        confirmButtonText: 'ຕົກລົງ',
      })
    }
  }

  return {
    billRef,
    shareBill,
    downloadBill,
    generateBillHTML,
  }
}

export default useShareableBill