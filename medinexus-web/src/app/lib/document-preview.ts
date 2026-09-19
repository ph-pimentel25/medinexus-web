import type { jsPDF } from "jspdf";
export function markDocumentPreview(doc: jsPDF) {
  for (let page=1;page<=doc.getNumberOfPages();page++) {
    doc.setPage(page);doc.setFont("helvetica","bold");doc.setFontSize(8);doc.setTextColor(140,70,25);
    doc.text("PREVIA SEM ASSINATURA DIGITAL ICP-BRASIL",doc.internal.pageSize.getWidth()/2,8,{align:"center"});
  }
}
