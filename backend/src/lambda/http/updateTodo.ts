import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda'

import { UpdateTodoRequest } from '../../requests/UpdateTodoRequest'

import { getUserId } from '../utils'

import { getTodo, updateTodo } from '../../businessLogic/todos'

import { createLogger } from '../../utils/logger'

const logger = createLogger('updateTodo')

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  logger.info('Processing UpdateTodo Event: ', event)
  
  const updatedTodo: UpdateTodoRequest = JSON.parse(event.body)

  const userId = getUserId(event)
  const todoId = event.pathParameters.todoId
  
  const todoItem = await getTodo(userId, todoId)
  if (!todoItem) {
    return {
      statusCode: 404,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify({
        error: 'Todo does not exist!'
      })
    }
  }

  await updateTodo(updatedTodo, userId, todoId)

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    },
    body: null
  }
}