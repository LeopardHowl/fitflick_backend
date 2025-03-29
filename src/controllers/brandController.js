import Brand from '../models/brandModel.js';

export const getAllBrands = async (req, res) => {
  try {
    const brands = await Brand.find();
    res.status(200).json(brands);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

export const getBrandById = async (req, res) => {
    console.log('Received request to get brand by ID:', req.params.id);
    
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand) {
      return res.status(404).json({ message: 'Brand not found' });
    }
    res.status(200).json(brand);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

export const createBrand = async (req, res) => {
  try {
    if (!req.body.name || !req.body.description || !req.body.logo) {
      return res.status(400).json({ message: 'Name, description, and logo are required.' });
    }
    
    const newBrand = new Brand({
      name: req.body.name,
      description: req.body.description,
      logo: req.body.logo,
      website: req.body.website,
      isActive: req.body.isActive !== undefined ? req.body.isActive : true
    });
    
    const savedBrand = await newBrand.save();
    res.status(201).json(savedBrand);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

export const updateBrand = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const brand = await Brand.findById(id);
    if (!brand) {
      return res.status(404).json({ message: 'Brand not found' });
    }
    
    const updatedBrand = await Brand.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    );
    
    res.status(200).json(updatedBrand);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

export const deleteBrand = async (req, res) => {
  try {
    const { id } = req.params;
    
    const brand = await Brand.findById(id);
    if (!brand) {
      return res.status(404).json({ message: 'Brand not found' });
    }
    
    await Brand.findByIdAndDelete(id);
    res.status(200).json({ message: 'Brand deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};



