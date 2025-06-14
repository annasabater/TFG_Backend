import { Request, Response } from 'express';
import Drone from '../models/drone_models.js';
import { getMyDrones } from '../service/drone_service.js';
import mongoose from 'mongoose';
import {
    createDrone,
    getDrones,
    getDroneById,
    updateDrone,
    deleteDrone,
    getOwnerByDroneId,
    getDronesByCategory,
    getDronesByPriceRange,
    addReviewToDrone,
    addFavorite,
    removeFavorite,
    getFavorites,
    purchaseDroneWithBalance,
    getDroneWithConvertedPrice,
    purchaseMultipleDrones,
    getUserPurchaseHistory,
    getUserSalesHistory
  } from '../service/drone_service.js';
import { getCommentsByDrone } from '../service/comment_service.js';
import exp from 'constants';


export const createDroneHandler = async (req: Request, res: Response) => {
  try {
    const {
      _id,
      status,
      createdAt,
      ratings,
      isSold,
      isService,
      ...droneData
    } = req.body;

    // Validar y forzar stock
    let stock = 1;
    if (typeof droneData.stock !== 'undefined') {
      stock = parseInt(droneData.stock);
      if (isNaN(stock) || stock < 0) stock = 1;
    }
    droneData.stock = stock;

    // Manejar imágenes subidas
    let images: string[] = [];
    if ((req as any).files && Array.isArray((req as any).files)) {
      images = (req as any).files.map((file: any) => 'http://localhost:9000/uploads/' + file.filename);
    }
    if (images.length > 0) {
      droneData.images = images;
    }

    const drone = await createDrone(droneData);
    res.status(201).json(drone);
  } catch (error: any) {
    console.error('ERROR createDrone:', error);
    res.status(500).json({ message: error.message || 'Error al crear el dron' });
  }
};

  

// Get all drones with pagination
export const getDronesHandler = async (req: Request, res: Response) => {
  try {
    const page  = parseInt(req.query.page as string) || 1;
    let limit = parseInt(req.query.limit as string) || 10;
    if (limit > 20) limit = 20;

    const filters: any = {
      q: req.query.q,
      category: req.query.category,
      condition: req.query.condition,
      location: req.query.location,
      priceMin: req.query.minPrice ? Number(req.query.minPrice) : undefined,
      priceMax: req.query.maxPrice ? Number(req.query.maxPrice) : undefined,
      name: req.query.name,
      model: req.query.model
    };
    // El filtro minRating se aplica después de la consulta
    const minRating = req.query.minRating ? Number(req.query.minRating) : undefined;

    let drones = await getDrones(page, limit, filters);
    // Filtrar por name y model (búsqueda parcial, case-insensitive)
    if (filters.name) {
      drones = drones.filter((d: any) => d.model && d.model.toLowerCase().includes(filters.name.toLowerCase()));
    }
    if (filters.model) {
      drones = drones.filter((d: any) => d.model && d.model.toLowerCase().includes(filters.model.toLowerCase()));
    }

    // Calcular averageRating de comentarios raíz para cada dron
    const dronesWithRatings = await Promise.all(
      drones.map(async (d: any) => {
        const comments = await getCommentsByDrone(d._id.toString());
        const rootRatings = comments
          .filter((c: any) => typeof c.rating === 'number' && (!c.parentCommentId || c.parentCommentId === null))
          .map((c: any) => c.rating);
        let averageRating = null;
        if (rootRatings.length > 0) {
          averageRating = rootRatings.reduce((a: number, b: number) => a + b, 0) / rootRatings.length;
          averageRating = Math.round(averageRating * 10) / 10; // Redondear a 1 decimal
        }
        return { ...d.toObject(), averageRating };
      })
    );

    // Filtrar por minRating usando el nuevo averageRating
    let filteredDrones = dronesWithRatings;
    if (minRating) {
      filteredDrones = filteredDrones.filter((d: any) => (d.averageRating || 0) >= minRating);
    }
    // Ordenar por fecha de creación descendente
    filteredDrones = filteredDrones.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // --- NUEVO: conversión de divisa ---
    const allowedCurrencies = ['EUR', 'USD', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'CNY', 'HKD', 'NZD'];
    const targetCurrency = req.query.currency as string;
    if (!targetCurrency || !allowedCurrencies.includes(targetCurrency)) {
      return res.status(400).json({ message: 'currency es requerido y debe ser una de: ' + allowedCurrencies.join(', ') });
    }
    // Convertir precios
    const convertedResult = await Promise.all(
      filteredDrones.map(async (d: any) => {
        let price = d.price;
        let currency = d.currency;
        if (d.currency !== targetCurrency) {
          const { getExchangeRate } = await import('../utils/exchangeRates.js');
          const rate = await getExchangeRate(d.currency, targetCurrency);
          price = Math.round(d.price * rate * 100) / 100;
          currency = targetCurrency;
        }
        return {
          _id: d._id,
          ownerId: d.ownerId,
          model: d.model,
          price,
          currency,
          averageRating: d.averageRating,
          images: d.images,
          category: d.category,
          condition: d.condition,
          location: d.location,
          status: d.status,
          stock: d.stock // <--- añadido
        };
      })
    );
    res.status(200).json(convertedResult);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error al obtener los drones' });
  }
};
  
  /* --- Favorits --- */
  export const addFavoriteHandler = async (req: Request, res: Response) => {
    try {
      const favs = await addFavorite(req.params.userId, req.params.droneId);
      res.status(200).json(favs);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  };
  
  export const removeFavoriteHandler = async (req: Request, res: Response) => {
    try {
      const favs = await removeFavorite(req.params.userId, req.params.droneId);
      res.status(200).json(favs);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  };
  
  export const getFavoritesHandler = async (req: Request, res: Response) => {
    try {
      const page  = parseInt(req.query.page  as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const favs  = await getFavorites(req.params.userId, page, limit);
      res.status(200).json(favs);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  };
  

// Obtener un dron por ID
export const getDroneByIdHandler = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        let drone = null;

        if (mongoose.Types.ObjectId.isValid(id)) {
            drone = await getDroneById(id);
        }

        if (!drone) {
            return res.status(404).json({ message: 'Drone no encontrado' });
        }

        // Obtener comentarios anidados
        const comments = await getCommentsByDrone(drone._id.toString());

        res.status(200).json({ ...drone.toObject(), comments });
    } catch (error: any) {
        res.status(500).json({ message: error.message || "Error al obtener el dron" });
    }
};

export const getOwnerByDroneIdHandler = async (req:Request,res: Response) => {
    try {
        const { id } = req.params;
        let user = null;

        if (mongoose.Types.ObjectId.isValid(id)) {
            user = await getOwnerByDroneId(id);
        }

        if (!user) {
            return res.status(404).json({ message: 'Drone no encontrado' });
        }

        res.status(200).json(user);
    } catch (error: any) {
        res.status(500).json({ message: error.message || "Error al obtener el dron" });
    }
}


// Actualizar un dron
export const updateDroneHandler = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        let drone = null;

        if (mongoose.Types.ObjectId.isValid(id)) {
            drone = await getDroneById(id);
        }

        if (!drone) {
            drone = await Drone.findOne({ id });
        }

        if (!drone) {
            return res.status(404).json({ message: 'Dron no encontrado' });
        }

        // Manejar imágenes subidas
        let images: string[] = [];
        if ((req as any).files && Array.isArray((req as any).files)) {
          images = (req as any).files.map((file: any) => 'http://localhost:9000/uploads/' + file.filename);
        }
        const updateData = { ...req.body };
        if (images.length > 0) {
          updateData.images = images;
        }

        // Validar y forzar stock
        if (typeof updateData.stock !== 'undefined') {
          let stock = parseInt(updateData.stock);
          if (isNaN(stock) || stock < 0) stock = 1;
          updateData.stock = stock;
        }

        // Parsear ratings si viene como string
        if (typeof updateData.ratings === 'string') {
          try {
            updateData.ratings = JSON.parse(updateData.ratings);
          } catch {
            updateData.ratings = [];
          }
        }

        const updatedDrone = await updateDrone(drone._id.toString(), updateData);

        res.status(200).json(updatedDrone);
    } catch (error: any) {
        res.status(500).json({ message: error.message || "Error al actualizar el dron" });
    }
};


// Eliminar un dron
export const deleteDroneHandler = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        let drone = null;

        if (mongoose.Types.ObjectId.isValid(id)) {
            drone = await getDroneById(id);
        }

        if (!drone) {
            drone = await Drone.findOne({ id });
        }

        if (!drone) {
            return res.status(404).json({ message: 'Dron no encontrado' });
        }

        await deleteDrone(drone._id.toString());

        res.status(200).json({ message: "Dron eliminado exitosamente" });
    } catch (error: any) {
        res.status(500).json({ message: error.message || "Error al eliminar el dron" });
    }
};

// Obtener drones por categoría
export const getDronesByCategoryHandler = async (req: Request, res: Response) => {
    try {
        const { category } = req.params;

        if (!category || typeof category !== "string") {
            return res.status(400).json({ message: "Debe proporcionar una categoría válida" });
        }

        const drones = await Drone.find({ category });

        if (drones.length === 0) {
            return res.status(404).json({ message: "No hay drones en esta categoría" });
        }

        res.status(200).json(drones);
    } catch (error: any) {
        res.status(500).json({ message: error.message || "Error al obtener drones por categoría" });
    }
};




// Obtener drones en un rango de precios
export const getDronesByPriceRangeHandler = async (req: Request, res: Response) => {
    try {
        const { min, max } = req.query;

        const minPrice = Number(min);
        const maxPrice = Number(max);

        if (isNaN(minPrice) || isNaN(maxPrice)) {
            return res.status(400).json({ message: "Parámetros inválidos, min y max deben ser números" });
        }

        const drones = await Drone.find({ price: { $gte: minPrice, $lte: maxPrice } });

        if (drones.length === 0) {
            return res.status(200).json([]);
        }

        res.status(200).json(drones);
    } catch (error: any) {
        res.status(500).json({ message: error.message || "Error al obtener drones en el rango de precios" });
    }
};



// Agregar una reseña a un dron
export const addDroneReviewHandler = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { userId, rating, comment } = req.body;
        let drone = null;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: "userId no es válido" });
        }

        if (typeof rating !== "number" || rating < 1 || rating > 5) {
            return res.status(400).json({ message: "El rating debe estar entre 1 y 5" });
        }

        if (mongoose.Types.ObjectId.isValid(id)) {
            drone = await getDroneById(id);
        }

        if (!drone) {
            drone = await Drone.findOne({ id });
        }

        if (!drone) {
            return res.status(404).json({ message: "Dron no encontrado" });
        }

        drone.ratings.push({ userId: new mongoose.Types.ObjectId(userId), rating, comment });
        await drone.save();

        res.status(200).json({ message: "Reseña agregada exitosamente", drone });
    } catch (error: any) {
        res.status(500).json({ message: error.message || "Error al agregar reseña" });
    }
};


export const getMyDronesHandler = async (req: Request, res: Response) => {
    try {
      const statusParam = req.query.status as string | undefined; // pending|sold
      const list = await getMyDrones(req.params.userId, statusParam as any);
      res.status(200).json(list);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  };

export const purchaseDroneHandler = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userId, payWithCurrency } = req.body;
    if (!userId || !payWithCurrency) {
      return res.status(400).json({ message: 'userId y payWithCurrency son requeridos' });
    }
    const result = await purchaseDroneWithBalance(id, userId, payWithCurrency);
    res.status(200).json(result);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const purchaseMultipleDronesHandler = async (req: Request, res: Response) => {
  try {
    const { userId, items, payWithCurrency } = req.body;
    if (!userId || !Array.isArray(items) || !payWithCurrency) {
      return res.status(400).json({ message: 'userId, items y payWithCurrency son requeridos' });
    }
    const result = await purchaseMultipleDrones(userId, items, payWithCurrency);
    res.status(200).json(result);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const getDroneConvertedPriceHandler = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { currency } = req.query;
    if (!currency) return res.status(400).json({ message: 'currency es requerido' });
    const drone = await getDroneWithConvertedPrice(id, currency as string);
    res.status(200).json(drone);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const getUserPurchaseHistoryHandler = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const purchases = await getUserPurchaseHistory(userId);
    res.status(200).json(purchases);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error al obtener el historial de compras del usuario' });
  }
};

export const getUserSalesHistoryHandler = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const sales = await getUserSalesHistory(userId);
    res.status(200).json(sales);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error al obtener el historial de ventas del usuario' });
  }
};

