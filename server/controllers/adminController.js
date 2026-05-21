import Booking from '../models/Booking.js';
import Show from '../models/Show.js';
import User from '../models/User.js';

export const getDashboardData = async (req, res) => {
  try {
    const [totalBookings, totalUsers, activeShows, paidBookings] = await Promise.all([
      Booking.countDocuments(),
      User.countDocuments(),
      Show.find({ showDateTime: { $gte: new Date() } })
        .sort({ showDateTime: 1 })
        .limit(20),
      Booking.find({ isPaid: true }),
    ]);

    const totalRevenue = paidBookings.reduce((sum, b) => sum + b.amount, 0);

    const activeShowsPlain = activeShows.map((s) => ({
      ...s.toObject(),
      occupiedSeats: Object.fromEntries(s.occupiedSeats),
    }));

    res.json({
      success: true,
      totalBookings,
      totalRevenue,
      totalUsers,
      activeShows: activeShowsPlain,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
