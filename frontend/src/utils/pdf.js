import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ============================================================
// EXPORT INVENTAIRE
// ============================================================
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

// ============================================================
// EXPORT STOCK
// ============================================================
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

// ============================================================
// EXPORT RAPPORT COMPLET
// ============================================================
export function exportRapportPDF(data, entreesSorties, periodeLabel) {
  const doc = new jsPDF();

  // ========== EN-TÊTE ==========
  doc.setFontSize(20);
  doc.setTextColor(30, 41, 59);
  doc.text("Rapport d'activité", 14, 20);

  doc.setFontSize(11);
  doc.setTextColor(100, 116, 139);
  doc.text(`Période : ${periodeLabel}`, 14, 30);
  doc.text(`Généré le : ${new Date().toLocaleString('fr-FR')}`, 14, 36);

  // ========== SYNTHÈSE GÉNÉRALE ==========
  doc.setFillColor(30, 41, 59);
  doc.rect(14, 44, 182, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.text('SYNTHÈSE GÉNÉRALE', 18, 50);

  doc.setTextColor(30, 41, 59);
  doc.setFontSize(10);

  const synthese = [
    ['Total Ventes', `${data.totalVentes.toFixed(2)} DT`],
    ['Total Achats Factures', `${data.totalFactures.toFixed(2)} DT`],
    ['Total Achats Hors facture', `${data.totalAchatsDirects.toFixed(2)} DT`],
    ['Total Achats', `${data.totalAchats.toFixed(2)} DT`],
    ['Total Dépenses', `${data.totalDepenses.toFixed(2)} DT`],
    ['BÉNÉFICE NET', `${data.benefice.toFixed(2)} DT`],
  ];

  let y = 58;
  for (const [label, val] of synthese) {
    doc.text(label, 18, y);
    doc.setFont('helvetica', 'bold');
    doc.text(val, 150, y);
    doc.setFont('helvetica', 'normal');
    y += 6;
  }

  // ========== DÉTAIL FACTURES ==========
  y += 4;
  doc.setFillColor(220, 38, 38);
  doc.rect(14, y, 182, 7, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.text('DÉTAIL FACTURES', 18, y + 5);
  y += 12;

  doc.setTextColor(30, 41, 59);
  doc.setFontSize(10);
  doc.text('Sous-total', 18, y);
  doc.text(`${data.totalSousTotalFactures.toFixed(2)} DT`, 150, y);
  y += 6;
  doc.text('Remises', 18, y);
  doc.text(`-${data.totalRemiseFactures.toFixed(2)} DT`, 150, y);
  y += 6;
  doc.text('TVA', 18, y);
  doc.text(`${data.totalTvaFactures.toFixed(2)} DT`, 150, y);
  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.text('Total TTC', 18, y);
  doc.text(`${data.totalFactures.toFixed(2)} DT`, 150, y);
  doc.setFont('helvetica', 'normal');

  // ========== ENTRÉES / SORTIES / DÉPENSES ==========
  if (entreesSorties) {
    y += 12;
    doc.setFillColor(30, 41, 59);
    doc.rect(14, y, 182, 7, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.text('ENTRÉES / SORTIES / DÉPENSES', 18, y + 5);
    y += 12;

    doc.setTextColor(30, 41, 59);
    doc.setFontSize(10);
    doc.text('Entrées — Factures', 18, y);
    doc.text(`${entreesSorties.totaux.entreesFactures.toFixed(2)} DT`, 150, y);
    y += 6;
    doc.text('Entrées — Hors facture', 18, y);
    doc.text(`${entreesSorties.totaux.entreesHorsFacture.toFixed(2)} DT`, 150, y);
    y += 6;
    doc.setFont('helvetica', 'bold');
    doc.text('Total Entrées', 18, y);
    doc.text(`${entreesSorties.totaux.entreesTotal.toFixed(2)} DT`, 150, y);
    doc.setFont('helvetica', 'normal');
    y += 6;
    doc.text('Sorties — Ventes', 18, y);
    doc.text(`${entreesSorties.totaux.sortiesVentes.toFixed(2)} DT`, 150, y);
    y += 6;
    doc.text('Dépenses (charges)', 18, y);
    doc.text(`${entreesSorties.totaux.depenses.toFixed(2)} DT`, 150, y);
    y += 6;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(37, 99, 235);
    doc.text('BÉNÉFICE NET', 18, y);
    doc.text(`${entreesSorties.totaux.beneficeNet.toFixed(2)} DT`, 150, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 41, 59);
  }

  // ========== VENTES PAR PRODUIT ==========
  if (data.ventesParProduit && data.ventesParProduit.length > 0) {
    doc.addPage();
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59);
    doc.text('Ventes par produit', 14, 20);

    autoTable(doc, {
      startY: 28,
      head: [['Code', 'Produit', 'Nb ventes', 'Quantité', 'Total']],
      body: data.ventesParProduit.map(v => [
        v.code,
        v.nom,
        v.nb,
        v.quantite,
        `${v.total.toFixed(2)} DT`,
      ]),
      theme: 'striped',
      headStyles: { fillColor: [22, 163, 74], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 2 },
      columnStyles: {
        0: { font: 'courier', cellWidth: 25 },
        2: { halign: 'center', cellWidth: 22 },
        3: { halign: 'center', cellWidth: 22 },
        4: { halign: 'right', cellWidth: 30, fontStyle: 'bold' },
      },
    });
  }

  // ========== ACHATS PAR PRODUIT ==========
  if (data.achatsParProduit && data.achatsParProduit.length > 0) {
    doc.addPage();
    doc.setFontSize(14);
    doc.text('Achats par produit', 14, 20);

    autoTable(doc, {
      startY: 28,
      head: [['Code', 'Produit', 'Qté Fact.', 'Total Fact.', 'Qté H.Fact.', 'Total H.Fact.', 'Total']],
      body: data.achatsParProduit.map(a => [
        a.code,
        a.nom,
        a.qteFacture || '—',
        a.totalFacture > 0 ? `${a.totalFacture.toFixed(2)} DT` : '—',
        a.qteHorsFacture || '—',
        a.totalHorsFacture > 0 ? `${a.totalHorsFacture.toFixed(2)} DT` : '—',
        `${a.total.toFixed(2)} DT`,
      ]),
      theme: 'striped',
      headStyles: { fillColor: [220, 38, 38], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: {
        0: { font: 'courier', cellWidth: 22 },
        2: { halign: 'center', cellWidth: 18 },
        3: { halign: 'right', cellWidth: 22 },
        4: { halign: 'center', cellWidth: 18 },
        5: { halign: 'right', cellWidth: 22 },
        6: { halign: 'right', cellWidth: 24, fontStyle: 'bold' },
      },
    });
  }

  // ========== DÉPENSES DÉTAILLÉES ==========
  if (data.depensesDetail && data.depensesDetail.length > 0) {
    doc.addPage();
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59);
    doc.text('Détail des dépenses', 14, 20);

    autoTable(doc, {
      startY: 28,
      head: [['Date', 'Libellé', 'Catégorie', 'Note', 'Montant']],
      body: data.depensesDetail.map(d => [
        new Date(d.date).toLocaleDateString('fr-FR'),
        d.libelle,
        d.categorie,
        d.note || '—',
        `${d.montant.toFixed(2)} DT`,
      ]),
      theme: 'striped',
      headStyles: { fillColor: [107, 114, 128], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 25 },
        2: { cellWidth: 30, halign: 'center' },
        3: { cellWidth: 40 },
        4: { halign: 'right', cellWidth: 30, fontStyle: 'bold' },
      },
    });
  }

  // ========== DÉTAIL PAR JOUR (Entrées/Sorties) ==========
  if (entreesSorties && entreesSorties.jours.length > 0) {
    doc.addPage();
    doc.setFontSize(14);
    doc.text('Détail journalier', 14, 20);

    autoTable(doc, {
      startY: 28,
      head: [['Date', 'Factures', 'H.Facture', 'Tot. Entrées', 'Ventes', 'Dépenses', 'Bénéfice']],
      body: entreesSorties.jours.map(j => [
        new Date(j.date).toLocaleDateString('fr-FR'),
        j.entreesFactures > 0 ? j.entreesFactures.toFixed(2) : '—',
        j.entreesHorsFacture > 0 ? j.entreesHorsFacture.toFixed(2) : '—',
        j.entreesTotal.toFixed(2),
        j.sortiesVentes > 0 ? j.sortiesVentes.toFixed(2) : '—',
        j.depenses > 0 ? j.depenses.toFixed(2) : '—',
        j.beneficeNet.toFixed(2),
      ]),
      theme: 'striped',
      headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { halign: 'right', cellWidth: 22 },
        2: { halign: 'right', cellWidth: 22 },
        3: { halign: 'right', cellWidth: 24, fontStyle: 'bold' },
        4: { halign: 'right', cellWidth: 22 },
        5: { halign: 'right', cellWidth: 22 },
        6: { halign: 'right', cellWidth: 24, fontStyle: 'bold' },
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 6) {
          const val = parseFloat(String(data.cell.raw));
          if (val < 0) data.cell.styles.textColor = [220, 38, 38];
          else data.cell.styles.textColor = [37, 99, 235];
        }
      },
    });
  }

  // ========== PIED DE PAGE ==========
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Mini-ERP Boutique — Rapport d'activité — Page ${i}/${pageCount}`,
      14,
      doc.internal.pageSize.height - 10
    );
  }

  const dateStr = new Date().toISOString().slice(0, 10);
  doc.save(`Rapport_${dateStr}.pdf`);
}