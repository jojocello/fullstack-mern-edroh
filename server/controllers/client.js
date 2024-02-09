import Product from "../models/Product.js";
import ProductStat from "../models/ProductStat.js";
import User from "../models/User.js";
import Transaction from "../models/Transaction.js";
import getCountryIso3 from "country-iso-2-to-3";

export const getProducts = async (req, res) => {
    try {
        const products = await Product.find();

        // Cette façon de joindre les données est lente
        // Il faudrait utiliser la fonction d'aggrégation de Mongo pour accélerer le process
        const productsWithStats = await Promise.all(
            products.map(async (product) => {
                const stat = await ProductStat.find({
                    productId: product._id,
                });
                return {
                    ...product._doc,  // nécessaire en raison du Promise.all
                    stat,
                };
            })
        );

        res.status(200).json(productsWithStats);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
};

export const getCustomers = async (req, res) => {
    try {
        const customers = await User.find({ role: "user" }).select("-password");  // on vire le champ password pour ne pas le retourner au frontend
        res.status(200).json(customers);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
};

// Datagrid en mode SSP (Server-Side Pagination)
export const getTransactions = async (req, res) => {
    try {
        // sort should look like this: { "field": "userId", "sort": "desc"}
        const { page = 1, pageSize = 20, sort = null, search = "" } = req.query;

        // formatted sort should look like { userId: -1 }
        const generateSort = () => {
            const sortParsed = JSON.parse(sort);
            const sortFormatted = {
                [sortParsed.field]: (sortParsed.sort == "asc" ? 1 : -1),
            };

            return sortFormatted;
        };
        const sortFormatted = Boolean(sort) ? generateSort() : {};

        const transactions = await Transaction.find({
            $or: [
                { cost: { $regex: new RegExp(search, "i") } },
                { userId: { $regex: new RegExp(search, "i") } },
            ],
        })
            .sort(sortFormatted)
            .skip(page * pageSize)
            .limit(pageSize);

        const total = await Transaction.countDocuments({
            name: { $regex: search, $options: "i" },
        });

        res.status(200).json({
            transactions,
            total,
        });
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
};

export const getGeography = async (req, res) => {
    try {
        const users = await User.find();

        // Besoin de mettre en forme le nombre de users par pays pour affichage dans Nivo/ResponsiveChoropleth 
        const mappedLocations = users.reduce((acc, { country }) => {    // reduce est un accumulateur de données au fur et a mesure qu'on liste 
            const countryISO3 = getCountryIso3(country);    // Passe FR en FRA
            if (!acc[countryISO3]) {
                acc[countryISO3] = 0;
            }
            acc[countryISO3]++;
            return acc;
        }, {});

        const formattedLocations = Object.entries(mappedLocations).map(
            ([country, count]) => {
                return { id: country, value: count };
            }
        );

        res.status(200).json(formattedLocations);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
};
