import { useRef } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import Swal from "sweetalert2";
import {
  computeUserTotals,
  calculateSettlements,
  type Settlement,
} from "../../../utils/splitCalculations";
import type { UserShare } from "../../../model/calculateModel";
import { getCategory } from "../../../constants/categories";

const useShareableBill = () => {
  const billRef = useRef<HTMLDivElement>(null);

  const generateBillHTML = (splitData: any): string => {
    // Recompute from raw purchases so legacy docs (without paid/consumed) render
    // correctly under the per-item consumption model.
    const users: UserShare[] = computeUserTotals(splitData.users || []);
    const settlements: Settlement[] = calculateSettlements(users);
    const fmt = (amount: number) =>
      (amount || 0).toLocaleString("lo-LA", { maximumFractionDigits: 0 });

    const nameById: Record<string, string> = {};
    users.forEach((u) => (nameById[u.userId] = u.userName));
    const consumerLabel = (ids?: string[]): string => {
      const list = ids && ids.length > 0 ? ids : users.map((u) => u.userId);
      if (list.length === users.length) return "ທຸກຄົນ";
      return list.map((id) => nameById[id] || "?").join(", ");
    };

    const totalAmount =
      splitData.totalAmount ??
      users.reduce(
        (s, u) => s + u.purchases.reduce((a, p) => a + p.amount, 0),
        0
      );
    const perUserAmount =
      splitData.perUserAmount ?? (users.length ? totalAmount / users.length : 0);

    const date = new Date(splitData.timestamp?.seconds * 1000 || Date.now());
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const dateStr = `${day}/${month}/${year}`;

    const INDIGO = "#4f46e5";
    const SLATE = "#1e293b";
    const MUTED = "#64748b";
    const LINE = "#e2e8f0";

    const settlementsHTML =
      settlements.length > 0
        ? settlements
            .map(
              (s) => `
        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 16px;border:1px solid ${LINE};border-radius:12px;margin-bottom:10px;">
          <div style="display:flex;align-items:center;gap:10px;min-width:0;">
            <span style="font-weight:700;color:${SLATE};">${s.from}</span>
            <span style="color:${INDIGO};font-size:18px;">→</span>
            <span style="font-weight:700;color:${SLATE};">${s.to}</span>
          </div>
          <span style="font-weight:700;color:${INDIGO};white-space:nowrap;">${fmt(
                s.amount
              )} ກີບ</span>
        </div>`
            )
            .join("")
        : `<div style="padding:14px 16px;border:1px solid ${LINE};border-radius:12px;color:#16a34a;font-weight:600;">✅ ທຸກຄົນເສຍສົມດູນແລ້ວ ບໍ່ຈຳເປັນຕ້ອງໂອນເງິນ</div>`;

    const usersHTML = users
      .map((user) => {
        const paid = user.paid ?? 0;
        const consumed = user.consumed ?? 0;
        const shouldReceive = user.currentBalance < 0;
        const shouldPay = user.currentBalance > 0;
        const statusColor = shouldReceive
          ? "#16a34a"
          : shouldPay
          ? "#f59e0b"
          : MUTED;
        const statusLabel = shouldReceive
          ? "ຄວນໄດ້ຮັບຄືນ"
          : shouldPay
          ? "ຍັງຕ້ອງຈ່າຍ"
          : "ເສຍສົມດູນ";

        const itemsHTML =
          user.purchases.length > 0
            ? `<div style="margin-top:12px;">
                ${user.purchases
                  .map(
                    (p) => `
                  <div style="display:flex;justify-content:space-between;gap:10px;padding:6px 0;border-top:1px dashed ${LINE};">
                    <div style="min-width:0;">
                      <div style="color:${SLATE};font-size:14px;">${getCategory(
                      p.category
                    ).emoji} ${p.itemName}</div>
                      <div style="color:${MUTED};font-size:12px;">ຮ່ວມ: ${consumerLabel(
                      p.consumers
                    )}</div>
                    </div>
                    <span style="color:${SLATE};font-size:14px;white-space:nowrap;">${fmt(
                      p.amount
                    )} ກີບ</span>
                  </div>`
                  )
                  .join("")}
              </div>`
            : "";

        return `
        <div class="user-card" style="border:1px solid ${LINE};border-radius:14px;padding:18px;margin-bottom:14px;background:#fff;">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:10px;">
            <span style="font-weight:700;font-size:17px;color:${SLATE};">${
          user.userName
        }</span>
            <span style="font-size:12px;font-weight:700;color:${statusColor};border:1px solid ${statusColor};padding:3px 10px;border-radius:999px;white-space:nowrap;">${statusLabel}</span>
          </div>
          <div style="display:flex;gap:24px;flex-wrap:wrap;">
            <div><div style="color:${MUTED};font-size:12px;">ຈ່າຍໄປ</div><div style="color:${SLATE};font-weight:600;">${fmt(
          paid
        )} ກີບ</div></div>
            <div><div style="color:${MUTED};font-size:12px;">ຮັບຜິດຊອບ</div><div style="color:${SLATE};font-weight:600;">${fmt(
          consumed
        )} ກີບ</div></div>
            <div style="margin-left:auto;text-align:right;"><div style="color:${MUTED};font-size:12px;">${statusLabel}</div><div style="color:${statusColor};font-weight:700;font-size:18px;">${fmt(
          Math.abs(user.currentBalance)
        )} ກີບ</div></div>
          </div>
          ${itemsHTML}
        </div>`;
      })
      .join("");

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          @page { size: A4; margin: 0; }
          * { box-sizing: border-box; }
          body { margin:0; padding:0; font-family:'Noto Sans Lao','Phetsarath OT',system-ui,sans-serif; color:${SLATE}; }
          .user-card { page-break-inside: avoid; }
          .section { page-break-inside: avoid; }
        </style>
      </head>
      <body>
        <div style="background:#f7f8fb;padding:28px;">
          <div style="max-width:760px;margin:0 auto;background:#fff;border:1px solid ${LINE};border-radius:20px;overflow:hidden;">

            <!-- Header -->
            <div style="padding:28px 28px 22px;border-bottom:1px solid ${LINE};">
              <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;flex-wrap:wrap;">
                <div style="min-width:0;">
                  <div style="font-size:12px;letter-spacing:1px;text-transform:uppercase;color:${INDIGO};font-weight:700;margin-bottom:4px;">🧾 ໃບບິນແບ່ງເງິນ</div>
                  <div style="font-size:26px;font-weight:800;color:${SLATE};word-break:break-word;">${
      splitData.tripName?.trim() || "ການແບ່ງເງິນ"
    }</div>
                  <div style="font-size:13px;color:${MUTED};margin-top:4px;">ວັນທີ່ ${dateStr}${
      splitData.userEmail ? ` · ${splitData.userEmail}` : ""
    }</div>
                </div>
                <div style="text-align:right;">
                  <div style="font-size:12px;color:${MUTED};">ຍອດລວມ</div>
                  <div style="font-size:24px;font-weight:800;color:${INDIGO};white-space:nowrap;">${fmt(
                    totalAmount
                  )} ກີບ</div>
                </div>
              </div>

              <div style="display:flex;gap:12px;margin-top:18px;flex-wrap:wrap;">
                <div style="flex:1;min-width:120px;border:1px solid ${LINE};border-radius:12px;padding:12px;">
                  <div style="font-size:12px;color:${MUTED};">👥 ຈຳນວນຄົນ</div>
                  <div style="font-size:18px;font-weight:700;">${
                    users.length
                  } ຄົນ</div>
                </div>
                <div style="flex:1;min-width:120px;border:1px solid ${LINE};border-radius:12px;padding:12px;">
                  <div style="font-size:12px;color:${MUTED};">💵 ສະເລ່ຍ/ຄົນ</div>
                  <div style="font-size:18px;font-weight:700;">${fmt(
                    perUserAmount
                  )} ກີບ</div>
                </div>
              </div>
            </div>

            <div style="padding:24px 28px;">
              <!-- Settlements first: who pays whom -->
              <div class="section" style="margin-bottom:28px;">
                <div style="font-size:16px;font-weight:700;margin-bottom:12px;color:${SLATE};">💸 ໃຜຕ້ອງຈ່າຍໃຫ້ໃຜ</div>
                ${settlementsHTML}
              </div>

              <!-- Per-person breakdown -->
              <div class="section">
                <div style="font-size:16px;font-weight:700;margin-bottom:12px;color:${SLATE};">ລາຍລະອຽດແຕ່ລະຄົນ</div>
                ${usersHTML}
              </div>
            </div>

            <div style="padding:18px 28px;border-top:1px solid ${LINE};text-align:center;color:${MUTED};font-size:12px;">
              ສ້າງໂດຍ <strong style="color:${INDIGO};">SPLITZY</strong> · ${new Date().toLocaleDateString(
      "lo-LA"
    )}
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  // Render the bill HTML to a canvas once; PDF and JPEG both reuse it.
  const renderCanvas = async (splitData: any): Promise<HTMLCanvasElement> => {
    const container = document.createElement("div");
    container.innerHTML = generateBillHTML(splitData);
    container.style.position = "absolute";
    container.style.left = "-9999px";
    container.style.top = "0";
    container.style.width = "816px";
    document.body.appendChild(container);

    try {
      const canvas = await html2canvas(container, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
        logging: false,
        windowHeight: container.scrollHeight,
      });
      return canvas;
    } finally {
      document.body.removeChild(container);
    }
  };

  const canvasToPdfBlob = (canvas: HTMLCanvasElement): Blob => {
    const imgData = canvas.toDataURL("image/jpeg", 0.95);
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight;

    while (heightLeft > 0) {
      position -= pdfHeight;
      pdf.addPage();
      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
    }

    return pdf.output("blob");
  };

  const fileBase = (splitData: any): string => {
    const name = (splitData.tripName || "bill")
      .toString()
      .trim()
      .replace(/\s+/g, "-");
    return `${name || "bill"}-${Date.now()}`;
  };

  const triggerDownload = (blobUrl: string, filename: string) => {
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename;
    a.click();
  };

  const ok = (text: string) =>
    Swal.fire({
      icon: "success",
      title: "ສຳເລັດ",
      text,
      timer: 1500,
      showConfirmButton: false,
    });

  const fail = (text: string) =>
    Swal.fire({
      icon: "error",
      title: "ຂໍ້ຜິດພາດ",
      text,
      confirmButtonText: "ຕົກລົງ",
    });

  const downloadBillPdf = async (splitData: any) => {
    try {
      const canvas = await renderCanvas(splitData);
      const blob = canvasToPdfBlob(canvas);
      const url = URL.createObjectURL(blob);
      triggerDownload(url, `${fileBase(splitData)}.pdf`);
      URL.revokeObjectURL(url);
      await ok("ດາວໂຫຼດ PDF ສຳເລັດແລ້ວ");
    } catch (error) {
      console.error("Error exporting PDF:", error);
      await fail("ບໍ່ສາມາດດາວໂຫຼດ PDF ໄດ້");
    }
  };

  const downloadBillJpeg = async (splitData: any) => {
    try {
      const canvas = await renderCanvas(splitData);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
      triggerDownload(dataUrl, `${fileBase(splitData)}.jpg`);
      await ok("ດາວໂຫຼດ JPEG ສຳເລັດແລ້ວ");
    } catch (error) {
      console.error("Error exporting JPEG:", error);
      await fail("ບໍ່ສາມາດດາວໂຫຼດ JPEG ໄດ້");
    }
  };

  const shareBill = async (splitData: any) => {
    try {
      const canvas = await renderCanvas(splitData);
      const blob = canvasToPdfBlob(canvas);
      const file = new File([blob], `${fileBase(splitData)}.pdf`, {
        type: "application/pdf",
      });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: "ໃບບິນແບ່ງເງິນ",
          text: "ໃບບິນການແບ່ງເງິນຈາກ SPLITZY",
          files: [file],
        });
        await ok("ແບ່ງປັນໃບບິນສຳເລັດແລ້ວ");
      } else {
        const url = URL.createObjectURL(blob);
        triggerDownload(url, `${fileBase(splitData)}.pdf`);
        URL.revokeObjectURL(url);
        await ok("ດາວໂຫຼດໃບບິນສຳເລັດແລ້ວ");
      }
    } catch (error) {
      console.error("Error sharing bill:", error);
      await fail("ບໍ່ສາມາດແບ່ງປັນໃບບິນໄດ້");
    }
  };

  return {
    billRef,
    shareBill,
    downloadBillPdf,
    downloadBillJpeg,
    generateBillHTML,
  };
};

export default useShareableBill;
