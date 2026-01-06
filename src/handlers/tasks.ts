import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { ObjectId } from 'mongodb';
import { connectToDatabase } from '../utils/db';
import { success, error } from '../utils/response';
import { ITask, ITaskInput, COLLECTION_NAME } from '../models/Task';

// CREATE TASK
export async function create(
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> {
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    console.log('📝 Creating new task...');
    const db = await connectToDatabase();
    const tasksCollection = db.collection<ITask>(COLLECTION_NAME);

    if (!event.body) {
      return error('Request body is required', 400);
    }

    const input: ITaskInput = JSON.parse(event.body);

    if (!input.title || input.title.trim() === '') {
      return error('Title is required', 400);
    }

    if (input.status && !['pending', 'in-progress', 'completed'].includes(input.status)) {
      return error('Invalid status. Must be pending, in-progress, or completed', 400);
    }

    if (input.priority && !['low', 'medium', 'high'].includes(input.priority)) {
      return error('Invalid priority. Must be low, medium, or high', 400);
    }

    if (input.dueDate && isNaN(Date.parse(input.dueDate))) {
      return error('Invalid dueDate', 400);
    }

    const task: ITask = {
      title: input.title,
      description: input.description || '',
      status: input.status || 'pending',
      priority: input.priority || 'medium',
      dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await tasksCollection.insertOne(task);
    console.log('✅ Task created:', result.insertedId);

    return success({
      _id: result.insertedId,
      ...task,
    }, 201);
  } catch (err: any) {
    console.error('❌ Create task error:', err);
    return error(err.message || 'Failed to create task', 500);
  }
}

// GET ALL TASKS
export async function getAll(
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> {
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    console.log('📋 Fetching all tasks...');
    const db = await connectToDatabase();
    const tasksCollection = db.collection<ITask>(COLLECTION_NAME);

    const status = event.queryStringParameters?.status;
    const priority = event.queryStringParameters?.priority;

    const filter: any = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    const tasks = await tasksCollection
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray();

    console.log(`✅ Found ${tasks.length} tasks`);
    return success({ tasks, count: tasks.length });
  } catch (err: any) {
    console.error('❌ Get tasks error:', err);
    return error(err.message || 'Failed to retrieve tasks', 500);
  }
}

// GET TASK BY ID
export async function getById(
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> {
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    const id = event.pathParameters?.id;
    console.log('🔍 Fetching task:', id);

    if (!id || !ObjectId.isValid(id)) {
      return error('Invalid task ID', 400);
    }

    const db = await connectToDatabase();
    const tasksCollection = db.collection<ITask>(COLLECTION_NAME);
    const task = await tasksCollection.findOne({ _id: new ObjectId(id) });

    if (!task) {
      return error('Task not found', 404);
    }

    console.log('✅ Task found');
    return success(task);
  } catch (err: any) {
    console.error('❌ Get task by ID error:', err);
    return error(err.message || 'Failed to retrieve task', 500);
  }
}

// UPDATE TASK
export async function update(
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> {
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    const id = event.pathParameters?.id;
    console.log('✏️ Updating task:', id);

    if (!id || !ObjectId.isValid(id)) {
      return error('Invalid task ID', 400);
    }

    if (!event.body) {
      return error('Request body is required', 400);
    }

    const db = await connectToDatabase();
    const tasksCollection = db.collection<ITask>(COLLECTION_NAME);
    const updates: Partial<ITaskInput> = JSON.parse(event.body);

    const updateDoc: any = {
      updatedAt: new Date(),
    };

    if (updates.title !== undefined) updateDoc.title = updates.title;
    if (updates.description !== undefined) updateDoc.description = updates.description;
    if (updates.status !== undefined) {
      if (!['pending', 'in-progress', 'completed'].includes(updates.status)) {
        return error('Invalid status', 400);
      }
      updateDoc.status = updates.status;
    }

    if (updates.priority !== undefined) {
      if (!['low', 'medium', 'high'].includes(updates.priority)) {
        return error('Invalid priority', 400);
      }
      updateDoc.priority = updates.priority;
    }

    if (updates.dueDate !== undefined) {
      if (isNaN(Date.parse(updates.dueDate))) {
        return error('Invalid dueDate', 400);
      }
      updateDoc.dueDate = new Date(updates.dueDate);
    }

    const result = await tasksCollection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateDoc },
      { returnDocument: 'after' }
    );

    if (!result) {
      return error('Task not found', 404);
    }

    console.log('✅ Task updated');
    return success(result);
  } catch (err: any) {
    console.error('❌ Update task error:', err);
    return error(err.message || 'Failed to update task', 500);
  }
}

// DELETE TASK
export async function deleteTask(
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> {
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    const id = event.pathParameters?.id;
    console.log('🗑️ Deleting task:', id);

    if (!id || !ObjectId.isValid(id)) {
      return error('Invalid task ID', 400);
    }

    const db = await connectToDatabase();
    const tasksCollection = db.collection<ITask>(COLLECTION_NAME);
    const result = await tasksCollection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return error('Task not found', 404);
    }

    console.log('✅ Task deleted');
    return success({ message: 'Task deleted successfully', id });
  } catch (err: any) {
    console.error('❌ Delete task error:', err);
    return error(err.message || 'Failed to delete task', 500);
  }
}