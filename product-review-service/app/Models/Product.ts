import { BaseModel, column, HasMany, hasMany } from '@ioc:Adonis/Lucid/Orm'
import ProductReview from './ProductReview'

export default class Product extends BaseModel {
  public static selfAssignPrimaryKey = true

  @column({ isPrimary: true })
  public id: string

  @column()
  public name: string

  @hasMany(() => ProductReview, {
    foreignKey: 'product_id',
    localKey: 'id'
  })
  public reviews: HasMany<typeof ProductReview>

}
