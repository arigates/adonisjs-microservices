import Rabbit from '@ioc:Adonis/Addons/Rabbit';
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Product from 'App/Models/Product';
import ProductReview from 'App/Models/ProductReview';
import { StatusCodes } from 'http-status-codes';
import Env from '@ioc:Adonis/Core/Env'

export default class ProductReviewsController {
  public async index({}: HttpContextContract) {}

  public async getReviewByPproduct({request, response}: HttpContextContract)
  {
    const productId = request.param('productId');
    
    const product = await this.checkProductExists(productId);
    
    if (!product) {
      return response.status(StatusCodes.NOT_FOUND).json('Product not found');
    }

    const productReviews = await Product
      .query()
      .where('id', productId)
      .preload('reviews')

    return response.status(StatusCodes.OK).json(productReviews);
  }

  public async store({request, response}: HttpContextContract) 
  {
    const productId = request.param('productId');

    const product = await this.checkProductExists(productId);
    
    if (!product) {
      return response.status(StatusCodes.NOT_FOUND).json('Product not found');
    }

    const input = request.only(['comment', 'rating']);

    const productReview = await product.related('reviews').create(input);

    this.updateProductRating(productId)

    return response.status(StatusCodes.CREATED).json(productReview);
  }

  public async edit({request, response}: HttpContextContract) 
  {
    const productId = request.param('productId');

    const product = await this.checkProductExists(productId);
    
    if (!product) {
      return response.status(StatusCodes.NOT_FOUND).json('Product not found');
    }

    const productReviewId = request.param('id');

    const productReview = await this.checkProductReviewExists(productId, productReviewId);

    if(!productReview) {
      return response.status(StatusCodes.NOT_FOUND).json('Product review not found');
    }

    return response.status(StatusCodes.OK).json(productReview);
  }

  public async update({request, response}: HttpContextContract) 
  {
    const productId = request.param('productId');

    const product = await this.checkProductExists(productId);
    
    if (!product) {
      return response.status(StatusCodes.NOT_FOUND).json('Product not found');
    }
    
    const productReviewId = request.param('id');

    const productReview = await this.checkProductReviewExists(productId, productReviewId);

    if(!productReview) {
      return response.status(StatusCodes.NOT_FOUND).json('Product review not found');
    }

    const input = request.only(['comment', 'rating']);

    const updated = await ProductReview
      .query()
      .where('id', productReviewId)
      .update(input);

    if(!updated) {
      return response.status(StatusCodes.BAD_REQUEST).json('Failed to update product review');
    }

    this.updateProductRating(productId);

    const updatedReview = await ProductReview.find(productReviewId);

    return response.status(StatusCodes.OK).json(updatedReview);
  }

  public async destroy({request, response}: HttpContextContract) 
  {
    const productId = request.param('productId');

    const product = await this.checkProductExists(productId);
    
    if (!product) {
      return response.status(StatusCodes.NOT_FOUND).json('Product not found');
    }
    
    const productReviewId = request.param('id');

    const productReview = await this.checkProductReviewExists(productId, productReviewId);

    if(!productReview) {
      return response.status(StatusCodes.NOT_FOUND).json('Product review not found');
    }

    await productReview.delete();

    this.updateProductRating(productId);

    return response.status(StatusCodes.OK).json('Delete product review successfully');
  }

  public async checkProductExists(id: string)
  {
    return await Product.find(id);
  }

  public async checkProductReviewExists(productId: string, id: string)
  {
    return await ProductReview
      .query()
      .where('product_id', productId)
      .where('id', id)
      .first();
  }

  public async updateProductRating(id: string) 
  {
    const rating = await ProductReview
      .query()
      .where('product_id', id)
      .avg('rating as avg_rating')
      .first();

    const productQueue = Env.get('RABBITMQ_PRODUCT_QUEUE') as string;

    await Rabbit.assertQueue(productQueue);

    await Rabbit.sendToQueue(productQueue, JSON.stringify({
      key: 'update_rating',
      data: {
        productId: id,
        rating: Number.parseFloat(rating?.$extras.avg_rating).toFixed(2)
      }
    }))
  }
}
