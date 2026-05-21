import { clerkClient } from '@clerk/express';
import User from '../models/User.js';

export const syncUser = async (req, res) => {
  try {
    const { userId } = req.auth();
    const clerkUser = await clerkClient.users.getUser(userId);

    const userData = {
      _id: userId,
      name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'User',
      email: clerkUser.emailAddresses[0]?.emailAddress || '',
      image: clerkUser.imageUrl || '',
    };

    const existing = await User.findById(userId);
    if (!existing) {
      await User.create(userData);
    } else {
      await User.findByIdAndUpdate(userId, {
        $set: { name: userData.name, email: userData.email, image: userData.image },
      });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const toggleFavorite = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { movieId } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const isFav = user.favorites.includes(Number(movieId));
    if (isFav) {
      user.favorites = user.favorites.filter((id) => id !== Number(movieId));
    } else {
      user.favorites.push(Number(movieId));
    }
    await user.save();

    res.json({ success: true, favorites: user.favorites, isFavorite: !isFav });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getFavorites = async (req, res) => {
  try {
    const { userId } = req.auth();
    const user = await User.findById(userId);
    if (!user) return res.json({ success: true, favorites: [] });
    res.json({ success: true, favorites: user.favorites });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
