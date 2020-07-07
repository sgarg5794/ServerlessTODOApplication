import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate'

import * as AWS  from 'aws-sdk'
const AWSXRay = require('aws-xray-sdk')
import { DocumentClient } from 'aws-sdk/clients/dynamodb'

import { createLogger } from '../utils/logger'

const logger = createLogger('todosAccess')

const XAWS = AWSXRay.captureAWS(AWS)

export class TodosAccess {
  constructor(
    // DynamoDB client
    private readonly docClient: DocumentClient = new XAWS.DynamoDB.DocumentClient(),
    
    // Attachments S3 bucket client
    private readonly s3 = new XAWS.S3({ signatureVersion: 'v4' }),

    // Environment variables
    private readonly todoItemsTable = process.env.TODO_ITEMS_TABLE_NAME,
    private readonly todoItemsCreatedAtIndex = process.env.TODO_ITEMS_CREATED_AT_INDEX,
    private readonly attachmentsBucketName = process.env.ATTACHMENTS_BUCKET_NAME,
    private readonly signedUrlExpirySeconds: Number = Number(process.env.SIGNED_URL_EXPIRY_SECONDS)
  ){}

  async getTodoItem(userId: string, todoId: string): Promise<TodoItem> {
    logger.info('-------------------- GET TODO ITEM : START --------------------')

    logger.info(`UserId: ${userId}, TodoId: ${todoId}`)

    const result = await this.docClient.get({
      TableName: this.todoItemsTable,
      Key: {
        'userId': userId,
        'todoId': todoId
      }
    }).promise()

    logger.info('Response: ', result)
  
    logger.info('-------------------- GET TODO ITEM : END --------------------')

    return result.Item as TodoItem
  } 

  async getTodoItems(userId: string): Promise<TodoItem[]> {
    logger.info('-------------------- GET TODO ITEMS : START --------------------')

    logger.info('UserId: ', userId)

    const result = await this.docClient.query({
      TableName: this.todoItemsTable,
      IndexName: this.todoItemsCreatedAtIndex,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      },
      ScanIndexForward: false
    }).promise()
  
    logger.info('Response: ', result)

    logger.info('-------------------- GET TODO ITEMS : END --------------------')

    return result.Items as TodoItem[]
  }

  async createTodoItem(todoItem: TodoItem): Promise<TodoItem> {
    logger.info('-------------------- CREATE TODO ITEM : START --------------------')

    logger.info('TodoItem: ', todoItem)

    await this.docClient.put({
      TableName: this.todoItemsTable,
      Item: todoItem
    }).promise()

    logger.info('-------------------- CREATE TODO ITEM : END --------------------')

    return todoItem
  }

  async updateTodoItem(todoUpdate: TodoUpdate, userId: string, todoId: string): Promise<void> {
    logger.info('-------------------- UPDATE TODO ITEM : START --------------------')

    logger.info('NewItem: ', todoUpdate)
    logger.info(`UserId: ${userId}, TodoId: ${todoId}`)

    await this.docClient.update({
      TableName: this.todoItemsTable,
      Key: {
        'userId': userId,
        'todoId': todoId
      },
      UpdateExpression: 'set #todoItemName = :name, dueDate = :dueDate, done = :done',
      ExpressionAttributeValues:{
        ':name': todoUpdate.name,
        ':dueDate': todoUpdate.dueDate,
        ':done': todoUpdate.done
      },
      ExpressionAttributeNames:{
        '#todoItemName': 'name'
      }
    }).promise()

    logger.info('-------------------- UPDATE TODO ITEM : END --------------------')
  }

  async deleteTodoItem(userId: string, todoId: string): Promise<void> {
    logger.info('-------------------- DELETE TODO ITEM : START --------------------')

    logger.info(`UserId: ${userId}, TodoId: ${todoId}`)

    await this.docClient.delete({
      TableName: this.todoItemsTable,
      Key: {
        'userId': userId,
        'todoId': todoId
      }
    }).promise()

    logger.info('-------------------- DELETE TODO ITEM : END --------------------')
  }

  async generateUploadUrl(userId: string, todoId: string): Promise<string> {
    logger.info('-------------------- GENERATE UPLOAD URL : START --------------------')
    
    const uploadUrl = `https://${this.attachmentsBucketName}.s3.amazonaws.com/${todoId}`
  
    logger.info(`UserId: ${userId}, TodoId: ${todoId}`)

    // Update attachmentUrl value in dynamodb table
    await this.docClient.update({
      TableName: this.todoItemsTable,
      Key: {
        'userId': userId,
        'todoId': todoId
      },
      UpdateExpression: 'set attachmentUrl = :attachmentUrl',
      ExpressionAttributeValues: {
        ':attachmentUrl': uploadUrl
      }
    }).promise()

    const url = this.getUploadUrl(todoId)

    logger.info(`Upload URL: ${url}`)

    logger.info('-------------------- GENERATE UPLOAD URL : END --------------------')

    return url;
  }

  // Get URL using which the client app can upload the attachment into S3 bucket
  private getUploadUrl(todoId: string) {
    return this.s3.getSignedUrl('putObject', {
      Bucket: this.attachmentsBucketName,
      Key: todoId,
      Expires: this.signedUrlExpirySeconds
    })
  }
}