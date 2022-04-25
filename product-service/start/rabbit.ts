/*
|--------------------------------------------------------------------------
| Preloaded File
|--------------------------------------------------------------------------
|
| Any code written inside this file will be executed during the application
| boot.
|
*/
import Rabbit from '@ioc:Adonis/Addons/Rabbit'
import Env from '@ioc:Adonis/Core/Env'
import Product from 'App/Models/Product';

async function listen() {
  const productMessage = Env.get('RABBITMQ_PRODUCT_QUEUE') as string;

  await Rabbit.assertQueue(productMessage)

  await Rabbit.consumeFrom(productMessage, async (message) => {
    const jsonMessage = message.jsonContent;

    if (typeof jsonMessage.key !== 'undefined' && jsonMessage.key === 'update_rating') {
        const productData = jsonMessage.data;

        await Product.query().where('id', productData.productId).update({
            rating: productData.rating
        });
    }

    message.ack();
  })
}

listen()