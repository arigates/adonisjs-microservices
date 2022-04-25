import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class ProductReviews extends BaseSchema {
  protected tableName = 'product_reviews'

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()
      table.string('comment').notNullable()
      table.integer('rating').notNullable();
      table.uuid('product_id');
      table.index('product_id');
      /**
       * Uses timestamptz for PostgreSQL and DATETIME2 for MSSQL
       */
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })
  }

  public async down () {
    this.schema.dropTable(this.tableName)
  }
}
