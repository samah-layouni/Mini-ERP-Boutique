import mongoose from 'mongoose';

const achatDirectSchema = new mongoose.Schema({
  produit:      { type: mongoose.Schema.Types.ObjectId, ref: 'Produit', required: true },
  quantite:     { type: Number, required: true },
  prixUnitaire: { type: Number, required: true },
  total:        { type: Number, required: true },
  fournisseur:  { type: String, default: '' },
  date:         { type: Date, default: Date.now },
  note:         { type: String, default: '' },
}, { timestamps: true });

export default mongoose.model('AchatDirect', achatDirectSchema);