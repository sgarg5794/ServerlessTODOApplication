import { TodosAccess } from '../dataLayer/todosAccess' 

import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate'

import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'

import * as uuid from 'uuid'

const todosAccess: TodosAccess = new TodosAccess()

export async function getTodo(userId: string, todoId: string): Promise<TodoItem> {
  return await todosAccess.getTodoItem(userId, todoId)
}

export async function getTodos(userId: string): Promise<TodoItem[]> {
  return await todosAccess.getTodoItems(userId)
}

export async function createTodo(createTodoRequest: CreateTodoRequest, userId: string): Promise<TodoItem> {
  const newItemId = uuid.v4()
  
  const todoItemToAdd: TodoItem = {
    userId: userId,
    todoId: newItemId,
    name: createTodoRequest.name,
    dueDate: createTodoRequest.dueDate,
    createdAt: new Date().toISOString(),
    done: false
  }
  
  return await todosAccess.createTodoItem(todoItemToAdd)
}

export async function updateTodo(updateTodoRequest: UpdateTodoRequest, userId: string, todoId: string): Promise<void> {
  const todoItemToUpdate: TodoUpdate = {
    name: updateTodoRequest.name,
    dueDate: updateTodoRequest.dueDate,
    done: updateTodoRequest.done
  }

  await todosAccess.updateTodoItem(todoItemToUpdate, userId, todoId)
}

export async function deleteTodo(userId: string, todoId: string): Promise<void> {
  return await todosAccess.deleteTodoItem(userId, todoId)
}

export async function generateUploadUrl(userId: string, todoId: string): Promise<string> {
  return await todosAccess.generateUploadUrl(userId, todoId)
}