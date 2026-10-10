const mongoose = require("mongoose");

const Address = require("../models/Address");


// Get All Addresses
const getAddresses = async (req, res) => {
    try {
        const addresses = await Address.find({
            user: req.user._id
        }).sort({ isDefault: -1, createdAt: -1 });

        return res.status(200).json({
            success: true,
            data: addresses
        });

    } catch (error) {
        console.error("Get addresses error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to get addresses"
        });
    }
};


// Add Address
const addAddress = async (req, res) => {
    try {
        const {
            fullName,
            phone,
            addressLine,
            city,
            state,
            pincode,
            landmark,
            addressType,
            isDefault
        } = req.body;

        if (
            !fullName ||
            !phone ||
            !addressLine ||
            !city ||
            !state ||
            !pincode
        ) {
            return res.status(400).json({
                success: false,
                message: "Please provide all required address fields"
            });
        }

        // If first address, make it default
        const addressCount = await Address.countDocuments({
            user: req.user._id
        });

        const shouldBeDefault =
            addressCount === 0 || isDefault === true;

        if (shouldBeDefault) {
            await Address.updateMany(
                { user: req.user._id },
                { $set: { isDefault: false } }
            );
        }

        const address = await Address.create({
            user: req.user._id,
            fullName,
            phone,
            addressLine,
            city,
            state,
            pincode,
            landmark,
            addressType,
            isDefault: shouldBeDefault
        });

        return res.status(201).json({
            success: true,
            message: "Address added successfully",
            data: address
        });

    } catch (error) {
        console.error("Add address error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to add address"
        });
    }
};


// Update Address
const updateAddress = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid address ID"
            });
        }

        const address = await Address.findOne({
            _id: id,
            user: req.user._id
        });

        if (!address) {
            return res.status(404).json({
                success: false,
                message: "Address not found"
            });
        }

        const allowedFields = [
            "fullName",
            "phone",
            "addressLine",
            "city",
            "state",
            "pincode",
            "landmark",
            "addressType"
        ];

        allowedFields.forEach((field) => {
            if (req.body[field] !== undefined) {
                address[field] = req.body[field];
            }
        });

        if (req.body.isDefault === true) {
            await Address.updateMany(
                {
                    user: req.user._id,
                    _id: { $ne: id }
                },
                { $set: { isDefault: false } }
            );

            address.isDefault = true;
        }

        await address.save();

        return res.status(200).json({
            success: true,
            message: "Address updated successfully",
            data: address
        });

    } catch (error) {
        console.error("Update address error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update address"
        });
    }
};


// Delete Address
const deleteAddress = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid address ID"
            });
        }

        const address = await Address.findOne({
            _id: id,
            user: req.user._id
        });

        if (!address) {
            return res.status(404).json({
                success: false,
                message: "Address not found"
            });
        }

        await address.deleteOne();

        // If deleted address was default,
        // make latest remaining address default
        if (address.isDefault) {
            const nextAddress = await Address.findOne({
                user: req.user._id
            }).sort({ createdAt: -1 });

            if (nextAddress) {
                nextAddress.isDefault = true;
                await nextAddress.save();
            }
        }

        return res.status(200).json({
            success: true,
            message: "Address deleted successfully"
        });

    } catch (error) {
        console.error("Delete address error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to delete address"
        });
    }
};


// Set Default Address
const setDefaultAddress = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid address ID"
            });
        }

        const address = await Address.findOne({
            _id: id,
            user: req.user._id
        });

        if (!address) {
            return res.status(404).json({
                success: false,
                message: "Address not found"
            });
        }

        await Address.updateMany(
            { user: req.user._id },
            { $set: { isDefault: false } }
        );

        address.isDefault = true;
        await address.save();

        return res.status(200).json({
            success: true,
            message: "Default address updated",
            data: address
        });

    } catch (error) {
        console.error("Set default address error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to set default address"
        });
    }
};


module.exports = {
    getAddresses,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress
};