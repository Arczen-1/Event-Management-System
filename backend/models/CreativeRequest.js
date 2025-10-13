const mongoose = require("mongoose");
// --- Material Schema ---
const MaterialSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    quantity: { type: Number, default: 1 },
    notes: { type: String, default: "" },
  },
  { _id: false }
);
// --- Creative Request Schema ---
const CreativeRequestSchema = new mongoose.Schema(
  {
    requestName: { type: String, required: true },
    designer: { type: String, required: true },
    dueDate: { type: Date, required: true },
    status: {
      type: String,
      enum: [
        "For Approval",
        "In Progress",
        "Sent to Purchasing",
        "Completed",
        "Draft",
        "Rejected",
      ],
      default: "For Approval",
    },
    contractRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contract",
      default: null,
    },
    materials: { type: [MaterialSchema], default: [] },
    notes: { type: String, default: "" },
    // --- Additional contract fields if needed ---
    contractName: { type: String, default: "" },
    client: { type: String, default: "" },
    contractNo: { type: String, default: "" },
    startDate: { type: Date },
    endDate: { type: Date },
  },
  { timestamps: true }
);
module.exports = mongoose.model("CreativeRequest", CreativeRequestSchema);