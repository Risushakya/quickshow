import Booking from '../models/Booking.js';
import Show from '../models/Show.js';
import User from '../models/User.js';

const STALE_MINUTES = 30;

export const createBooking = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { showId, selectedSeats } = req.body;

    if (!showId || !selectedSeats?.length) {
      return res.status(400).json({ success: false, message: 'Show and seats are required' });
    }

    const show = await Show.findById(showId);
    if (!show) return res.status(404).json({ success: false, message: 'Show not found' });

    for (const seat of selectedSeats) {
      if (show.occupiedSeats.has(seat)) {
        return res.status(400).json({ success: false, message: `Seat ${seat} is already taken` });
      }
    }

    for (const seat of selectedSeats) {
      show.occupiedSeats.set(seat, userId);
    }
    await show.save();

    const amount = selectedSeats.length * show.showPrice;

    const booking = await Booking.create({
      user: userId,
      show: showId,
      amount,
      bookedSeats: selectedSeats,
      isPaid: false,
    });

    res.json({ success: true, booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUserBookings = async (req, res) => {
  try {
    const { userId } = req.auth();

    // Auto-release seats and delete unpaid bookings older than STALE_MINUTES
    const cutoff = new Date(Date.now() - STALE_MINUTES * 60 * 1000);
    const stale = await Booking.find({ user: userId, isPaid: false, createdAt: { $lt: cutoff } });
    for (const b of stale) {
      const show = await Show.findById(b.show);
      if (show) {
        for (const seat of b.bookedSeats) show.occupiedSeats.delete(seat);
        await show.save();
      }
      await Booking.findByIdAndDelete(b._id);
    }

    const bookings = await Booking.find({ user: userId })
      .populate('show')
      .sort({ createdAt: -1 });

    const result = bookings.map((b) => {
      const obj = b.toObject();
      if (obj.show?.occupiedSeats instanceof Map) {
        obj.show.occupiedSeats = Object.fromEntries(obj.show.occupiedSeats);
      }
      return obj;
    });

    res.json({ success: true, bookings: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find().populate('show').sort({ createdAt: -1 });

    const result = await Promise.all(
      bookings.map(async (b) => {
        const obj = b.toObject();
        const user = await User.findById(b.user).lean();
        obj.user = user ? { name: user.name } : { name: 'Unknown' };
        if (obj.show?.occupiedSeats instanceof Map) {
          obj.show.occupiedSeats = Object.fromEntries(obj.show.occupiedSeats);
        }
        return obj;
      })
    );

    res.json({ success: true, bookings: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const payBooking = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { id } = req.params;

    const booking = await Booking.findOne({ _id: id, user: userId });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    booking.isPaid = true;
    await booking.save();

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const cancelBooking = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { id } = req.params;

    const booking = await Booking.findOne({ _id: id, user: userId });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (booking.isPaid) return res.status(400).json({ success: false, message: 'Cannot cancel a paid booking' });

    // Release seats back to the show
    const show = await Show.findById(booking.show);
    if (show) {
      for (const seat of booking.bookedSeats) {
        show.occupiedSeats.delete(seat);
      }
      await show.save();
    }

    await Booking.findByIdAndDelete(id);
    res.json({ success: true, message: 'Booking cancelled and seats released' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
