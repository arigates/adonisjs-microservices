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
  const producReviewtMessage = Env.get('RABBITMQ_PRODUCT_REVIEW_QUEUE') as string;

  await Rabbit.assertQueue(producReviewtMessage)

  await Rabbit.consumeFrom(producReviewtMessage, async (message) => {
    
    const jsonMessage = message.jsonContent;

    if (typeof jsonMessage.key !== 'undefined' && jsonMessage.key === 'upsert_product') {
        let productData = jsonMessage.data;
        await Product.updateOrCreate({
          id: productData.productId,
        },
        {  
          name: productData.productName
        });
    }

    message.ack();
  })
}

listen()