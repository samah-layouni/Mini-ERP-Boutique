import mongoose from 'mongoose';

const venteSchema = new mongoose.Schema({
  produit:      { type: mongoose.Schema.Types.ObjectId, ref: 'Produit' },
  quantite:     { type: Number, required: true },
  prixUnitaire: { type: Number, required: true },
  total:        { type: Number, required: true },
  date:         { type: Date, default: Date.now },
  note:         { type: String, default: '' },
}, { timestamps: true });

export default mongoose.model('Vente', venteSchema);