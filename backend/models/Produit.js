import mongoose from 'mongoose';

const produitSchema = new mongoose.Schema({
  nom:       { type: String, required: true },
  categorie: { type: String, default: '' },
  prixAchat: { type: Number, default: 0 },
  prixVente: { type: Number, default: 0 },
  stock:     { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model('Produit', produitSchema);