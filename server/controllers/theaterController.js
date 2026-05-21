import Theater from '../models/Theater.js';
import Show from '../models/Show.js';

export const addTheater = async (req, res) => {
  try {
    const { name, city, address } = req.body;
    if (!name || !city || !address) {
      return res.status(400).json({ success: false, message: 'name, city and address are required' });
    }
    const theater = await Theater.create({ name, city, address });
    res.json({ success: true, theater });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTheaters = async (req, res) => {
  try {
    const theaters = await Theater.find().sort({ createdAt: -1 });
    res.json({ success: true, theaters });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteTheater = async (req, res) => {
  try {
    const { force } = req.query;
    const activeShows = await Show.countDocuments({
      'theater._id': req.params.id,
      showDateTime: { $gte: new Date() },
    });

    if (activeShows > 0 && force !== 'true') {
      return res.status(409).json({
        success: false,
        message: `This theater has ${activeShows} upcoming show(s). Pass ?force=true to delete anyway.`,
        activeShows,
      });
    }

    await Theater.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Theater deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
