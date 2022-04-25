import Rabbit from '@ioc:Adonis/Addons/Rabbit';
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import Product from 'App/Models/Product';
import { StatusCodes } from 'http-status-codes';
import { DateTime } from 'luxon';
import Env from '@ioc:Adonis/Core/Env'

export default class ProductsController {
  public async index({response}: HttpContextContract) 
  {
    const products = await Product
      .query()
      .orderBy('created_at', 'desc')
      .whereNull('deleted_at');

    return response.status(StatusCodes.OK).json(products);
  }

  public async store({ request, response }: HttpContextContract) 
  {
    const input = request.only(['name', 'sell_price', 'buy_price', 'status']);

    const product = await Product.create(input);

    this.publishMessage(product);

    return response.status(StatusCodes.CREATED).json(product);
  }

  public async edit({request, response}: HttpContextContract) 
  {
    const id = request.param('id');

    const product = await this.checkProductExists(id);

    if (!product) {
      return response.status(StatusCodes.NOT_FOUND).json('Product not found');
    }

    return response.status(StatusCodes.OK).json(product);
  }

  public async update({request, response}: HttpContextContract) 
  {
    const id = request.param('id');

    const product = await this.checkProductExists(id);

    if (!product) {
      return response.status(StatusCodes.NOT_FOUND).json('Product not found');
    }

    const input = request.only(['name', 'sell_price', 'buy_price', 'status']);

    const updated = await Product
      .query()
      .where('id', id)
      .update(input)

    if (!updated) {
      return response.status(StatusCodes.BAD_REQUEST).json('Failed to update product');
    }

    const updatedProduct = await Product.find(id);

    this.publishMessage(updatedProduct);

    return response.status(StatusCodes.OK).json(updatedProduct);
  }

  public async destroy({request, response}: HttpContextContract) 
  {
    const id = request.param('id');

    const product = await this.checkProductExists(id);

    if (!product) {
      return response.status(StatusCodes.NOT_FOUND).json('Product not found');
    }

    const deleted = await Product
      .query()
      .where('id', id)
      .update({
        'deleted_at': DateTime.local()
      })

    if (!deleted) {
      return response.status(StatusCodes.BAD_REQUEST).json('Failed to delete product');
    }

    return response.status(StatusCodes.OK).json('delete product successfully');
  }

  public async checkProductExists(id: string)
  {
    return await Product
      .query()
      .whereNull('deleted_at')
      .where('id', id)
      .first();
  }

  public async publishMessage(product: Product | null)
  {

    if (!product) {
      return;
    }

    let binds = Env.get('RABBITMQ_SERVICE_QUEUES');

    await Rabbit.assertExchange('amq.fanout', 'fanout', {
      durable: true
    });

    binds = binds.split(",");

    binds.forEach( async (bind: any) => await Rabbit.bindQueue(bind, 'amq.fanout'))
  
    await Rabbit.sendToExchange('amq.fanout', '', JSON.stringify({
      key: 'upsert_product',
      data: {
        productId: product.id,
        productName: product.name,
        productStatus: product.status
      }
    }));
  }
}
