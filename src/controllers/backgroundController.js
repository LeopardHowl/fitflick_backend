import Background from "../models/backgroundModel.js";

export const getAllBackgrounds = async (req, res) => {
  try {
    console.log("getAllBackgrounds called");
    const backgrounds = await Background.find();
    res.status(200).json(backgrounds);
  } catch (error) {
    console.error(error); 
    res.status(500).json({ message: error.message });
  }
};

export const getBackgroundById = async (req, res) => {
  try {
    const { id } = req.params;
    const background = await Background.findById(id);
    if (!background) {
      return res.status(404).json({ message: 'Background not found' });
    }
    res.status(200).json(background);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getBackgroundByCategory = async (req, res) => {
    try {
        const { category } = req.params;
        if (!category) {
            throw new Error('Category is required.');
        }
        const backgrounds = await Background.find({ category });
        if (!backgrounds.length) {
            res.status(404).json({ message: `No backgrounds found for category: ${category}` });
            return;
        }

        res.status(200).json(backgrounds);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};


export const createBackground = async (req, res) => {
  try {

    console.log("================🙌=====>", req.body);

    if (!req.body.name || !req.body.image || !req.body.category) {
        throw new Error('Name, image, and category are required.');
    }

    const background = new Background(req.body);
    const savedBackground = await background.save();
    res.status(201).json(savedBackground);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

export const updateBackground = async (req, res) => {
    try {
      const background = await Background.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!background) {
        return res.status(404).json({ message: 'Background not found' });
      }
      res.status(200).json(background);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: error.message });
    }
  };

export const deleteBackground = async (req, res) => {
  try {
    const background = await Background.findByIdAndDelete(req.params.id);
    if (!background) {
      return res.status(404).json({ message: 'Background not found' });
    }
    res.status(200).json({ message: 'Background deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};