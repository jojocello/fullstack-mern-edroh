import mongoose from "mongoose";
import User from "../models/User.js";
import Transaction from "../models/Transaction.js";

export const getAdmins = async (req, res) => {
    try {
        const admins = await User.find({ role: "admin" }).select("-password");
        res.status(200).json(admins);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
};

export const getUserPerformance = async (req, res) => {
    try {
        const { id } = req.params;

        // Fait la même chose que getProductStats mais en requête aggrégée (plus rapide)
        const userWithStats = await User.aggregate([
            // Recup les infos du User par son id
            { $match: { _id: new mongoose.Types.ObjectId(id) } },
            {
                // compare ce local _id de la table User avec le foreign userId de la table AffiliateStats
                // stocke le résultat du join dans variable affiliateStats
                $lookup: {
                    from: "affiliatestats",
                    localField: "_id",      
                    foreignField: "userId",
                    as: "affiliateStats",
                },
            },
            // flatten la variable affiliateStats
            { $unwind: "$affiliateStats" },
        ]);

        const saleTransactions = await Promise.all(
            userWithStats[0].affiliateStats.affiliateSales.map((id) => {
                return Transaction.findById(id);
            })
        );
        const filteredSaleTransactions = saleTransactions.filter(
            (transaction) => transaction !== null
        );

        res
            .status(200)
            .json({ user: userWithStats[0], sales: filteredSaleTransactions });
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
};
