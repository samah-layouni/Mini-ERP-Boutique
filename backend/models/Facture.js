import mongoose from 'mongoose';

const ligneSchema = new mongoose.Schema({
  produit:      { type: mongoose.Schema.Types.ObjectId, ref: 'Produit' },
  designation:  { type: String, default: '' },
  quantite:     { type: Number, default: 1 },
  prixUnitaire: { type: Number, default: 0 },
  totalLigne:   { type: Number, default: 0 },
});

const factureSchema = new mongoose.Schema({
  numFacture:    { type: String, required: true, unique: true },
  fournisseur:   { type: String, default: '' },
  dateFacture:   { type: Date, required: true },
  lignes:        [ligneSchema],
  sousTotal:     { type: Number, default: 0 },
  remiseType:    { type: String, enum: ['percent', 'montant'], default: 'percent' },
  remiseValeur:  { type: Number, default: 0 },
  remiseMontant: { type: Number, default: 0 },
  tvaActive:     { type: Boolean, default: false },
  tvaTaux:       { type: Number, default: 19 },
  tvaMontant:    { type: Number, default: 0 },
  totalTTC:      { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model('Facture', factureSchema);