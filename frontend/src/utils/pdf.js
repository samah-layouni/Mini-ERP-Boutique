import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function exportInventairePDF(inventaire) {
  const doc = new jsPDF();

  doc.setFontSize(20);
  doc.setTextColor(30, 41, 59);
  doc.text("Rapport d'Inventaire", 14, 20);

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`Référence : ${inventaire.reference}`, 14, 30);
  doc.text(
    `Date début : ${new Date(inventaire.dateDebut).toLocaleDateString('fr-FR')}`,
    14,
    36
  );
  if (inventaire.dateFin) {
    doc.text(
      `Date fin : ${new Date(inventaire.dateFin).toLocaleDateString('fr-FR')}`,
      14,
      42
    );
  }
  doc.text(`Statut : ${inventaire.statut === 'valide' ? 'Validé' : 'En cours'}`, 14, 48);

  const total = inventaire.lignes.length;
  const avecEcart = inventaire.lignes.filter(l => l.ecart !== 0).length;
  const manquants = inventaire.lignes.filter(l => l.ecart < 0).length;
  const excedents = inventaire.lignes.filter(l => l.ecart > 0).length;
  const totalEcart = inventaire.lignes.reduce((s, l) => s + (l.ecart || 0), 0);

  doc.setFillColor(241, 245, 249);
  doc.rect(14, 54, 182, 20, 'F');
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(11);
  doc.text(`Produits : ${total}`, 20, 62);
  doc.text(`Avec écart : ${avecEcart}`, 60, 62);
  doc.text(`Manquants : ${manquants}`, 105, 62);
  doc.text(`Excédents : ${excedents}`, 145, 62);
  doc.setFontSize(10);
  doc.text(`Écart total : ${totalEcart > 0 ? '+' : ''}${totalEcart}`, 20, 70);

  const rows = inventaire.lignes.map(l => [
    l.code || '',
    l.nom || '',
    l.stockTheorique ?? 0,
    l.stockCompte ?? 0,
    (l.ecart > 0 ? '+' : '') + (l.ecart ?? 0),
    l.note || '',
  ]);

  autoTable(doc, {
    startY: 82,
    head: [['Code', 'Produit', 'Théorique', 'Compté', 'Écart', 'Note']],
    body: rows,
    theme: 'striped',
    headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 2 },
    columnStyles: {
      0: { font: 'courier', cellWidth: 25 },
      2: { halign: 'center', cellWidth: 22 },
      3: { halign: 'center', cellWidth: 22 },
      4: { halign: 'center', cellWidth: 20, fontStyle: 'bold' },
    },
    didParseCell: data => {
      if (data.section === 'body' && data.column.index === 4) {
        const val = parseInt(data.cell.raw) || 0;
        if (val < 0) data.cell.styles.textColor = [220, 38, 38];
        else if (val > 0) data.cell.styles.textColor = [37, 99, 235];
        else data.cell.styles.textColor = [22, 163, 74];
      }
    },
  });

  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Généré le ${new Date().toLocaleString('fr-FR')} — Page ${i}/${pageCount}`,
      14,
      doc.internal.pageSize.height - 10
    );
  }

  doc.save(`inventaire_${inventaire.reference}.pdf`);
}

export function exportStockPDF(produits, stats) {
  const doc = new jsPDF();

  doc.setFontSize(20);
  doc.setTextColor(30, 41, 59);
  doc.text('État du Stock', 14, 20);

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`Généré le ${new Date().toLocaleString('fr-FR')}`, 14, 28);

  doc.setFillColor(241, 245, 249);
  doc.rect(14, 34, 182, 24, 'F');
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(10);
  doc.text(`Produits : ${stats.totalProduits}`, 20, 42);
  doc.text(`Articles : ${stats.totalArticles}`, 20, 48);
  doc.text(`Valeur achat : ${stats.totalValeurAchat.toFixed(2)} DT`, 20, 54);
  doc.text(`Valeur vente : ${stats.totalValeurVente.toFixed(2)} DT`, 90, 42);
  doc.text(`Marge potentielle : ${stats.margePotentielle.toFixed(2)} DT`, 90, 48);
  doc.text(`Ruptures : ${stats.ruptures}`, 90, 54);

  const rows = produits.map(p => [
    p.code || '',
    p.nom || '',
    p.categorie || '',
    p.stock,
    p.prixAchat.toFixed(2),
    p.prixVente.toFixed(2),
    (p.stock * p.prixAchat).toFixed(2),
    p.stock <= 0 ? 'RUPTURE' : p.stock <= 5 ? 'FAIBLE' : 'OK',
  ]);

  autoTable(doc, {
    startY: 64,
    head: [['Code', 'Produit', 'Catégorie', 'Stock', 'P.Achat', 'P.Vente', 'Valeur', 'État']],
    body: rows,
    theme: 'striped',
    headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 8, cellPadding: 2 },
    columnStyles: {
      0: { font: 'courier', cellWidth: 22 },
      3: { halign: 'center', cellWidth: 15 },
      4: { halign: 'right', cellWidth: 20 },
      5: { halign: 'right', cellWidth: 20 },
      6: { halign: 'right', cellWidth: 22 },
      7: { halign: 'center', cellWidth: 18, fontStyle: 'bold' },
    },
    didParseCell: data => {
      if (data.section === 'body' && data.column.index === 7) {
        const val = String(data.cell.raw);
        if (val === 'RUPTURE') data.cell.styles.textColor = [220, 38, 38];
        else if (val === 'FAIBLE') data.cell.styles.textColor = [234, 88, 12];
        else data.cell.styles.textColor = [22, 163, 74];
      }
    },
  });

  doc.save(`stock_${new Date().toISOString().slice(0, 10)}.pdf`);
}