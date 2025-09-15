const mongoose = require("mongoose")

// Contract schema to store full contract details. We keep it flexible using nested objects
// so we can evolve fields as needed without breaking migrations.
const ContractSchema = new mongoose.Schema(
  {
    contractNumber: { type: String, required: true, unique: true }, // e.g., 2025/09/15-0001
    // High-level fields commonly needed for filtering
    department: { type: String, default: "Sales" },
    status: { type: String, default: "Draft" },
    // Store full form payload grouped by page/section for easier rendering later
    page1: { type: Object, default: {} },
    page2: { type: Object, default: {} },
    page3: { type: Object, default: {} },
  },
  { timestamps: true }
)

module.exports = mongoose.model("Contract", ContractSchema)


