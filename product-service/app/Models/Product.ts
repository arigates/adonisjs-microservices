import { DateTime } from 'luxon'
import { BaseModel, beforeCreate, column } from '@ioc:Adonis/Lucid/Orm'
import { v4 as uuidv4 } from 'uuid';
import ProductStatus from 'contracts/enums/ProductStatus'

export default class Product extends BaseModel {

  public static selfAssignPrimaryKey = true

  @column({ isPrimary: true })
  public id: string

  @column()
  public name: string

  @column()
  public buyPrice: number

  @column()
  public sellPrice: number

  @column()
  public rating: number

  @column()
  public status: string

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @column.dateTime({ autoCreate: false})
  public deletedAt?: DateTime

  @beforeCreate()
  public static async createUUID (model: Product) {
    model.id = uuidv4()
  }
}
