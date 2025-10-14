import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { addTask, updateTask, deleteTask, toggleTaskStatus, setTaskError } from '../store/slices/taskSlice';
import ApiService from '../services/api';
import offlineQueue from '../services/offlineQueue';
import { Task } from '../types';

/**
 * useOptimisticTasks Hook
 *
 * Provides optimistic updates for tasks
 * Updates UI immediately, then syncs with server
 * Queues requests when offline
 */
export const useOptimisticTasks = () => {
  const dispatch = useDispatch();
  const tasks = useSelector((state: RootState) => state.task.tasks);
  const loading = useSelector((state: RootState) => state.task.loading);
  const error = useSelector((state: RootState) => state.task.error);
  const isOnline = offlineQueue.getOnlineStatus();

  /**
   * Create task with optimistic update
   */
  const createTask = useCallback(async (taskData: Omit<Task, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    // Generate temporary ID for optimistic update
    const tempId = `temp_${Date.now()}`;
    const optimisticTask: Task = {
      ...taskData,
      id: tempId,
      userId: 'temp',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Optimistically add to store
    dispatch(addTask(optimisticTask));

    try {
      if (isOnline) {
        // Send to server
        const createdTask = await ApiService.createTask(taskData);

        // Replace temporary task with real task
        dispatch(deleteTask(tempId));
        dispatch(addTask(createdTask));

        return createdTask;
      } else {
        // Queue for later
        await offlineQueue.queueRequest('POST', '/api/tasks', taskData);
        console.log('📴 Task queued for creation when online');
        return optimisticTask;
      }
    } catch (error: any) {
      // Rollback on error
      dispatch(deleteTask(tempId));
      dispatch(setTaskError(error.message || 'Failed to create task'));
      throw error;
    }
  }, [dispatch, isOnline]);

  /**
   * Update task with optimistic update
   */
  const modifyTask = useCallback(async (taskId: string, updates: Partial<Task>) => {
    // Store original task for rollback
    const originalTask = tasks.find(t => t.id === taskId);
    if (!originalTask) {
      throw new Error('Task not found');
    }

    // Optimistically update store
    dispatch(updateTask({ id: taskId, updates }));

    try {
      if (isOnline) {
        // Send to server
        const updatedTask = await ApiService.updateTask(taskId, updates);

        // Update with server response
        dispatch(updateTask({ id: taskId, updates: updatedTask }));

        return updatedTask;
      } else {
        // Queue for later
        await offlineQueue.queueRequest('PUT', `/api/tasks/${taskId}`, updates);
        console.log('📴 Task update queued for when online');
        return { ...originalTask, ...updates };
      }
    } catch (error: any) {
      // Rollback on error
      dispatch(updateTask({ id: taskId, updates: originalTask }));
      dispatch(setTaskError(error.message || 'Failed to update task'));
      throw error;
    }
  }, [dispatch, tasks, isOnline]);

  /**
   * Delete task with optimistic update
   */
  const removeTask = useCallback(async (taskId: string) => {
    // Store original task for rollback
    const originalTask = tasks.find(t => t.id === taskId);
    if (!originalTask) {
      throw new Error('Task not found');
    }

    // Optimistically remove from store
    dispatch(deleteTask(taskId));

    try {
      if (isOnline) {
        // Send to server
        await ApiService.deleteTask(taskId);
      } else {
        // Queue for later
        await offlineQueue.queueRequest('DELETE', `/api/tasks/${taskId}`);
        console.log('📴 Task deletion queued for when online');
      }
    } catch (error: any) {
      // Rollback on error
      dispatch(addTask(originalTask));
      dispatch(setTaskError(error.message || 'Failed to delete task'));
      throw error;
    }
  }, [dispatch, tasks, isOnline]);

  /**
   * Toggle task status with optimistic update
   */
  const toggleStatus = useCallback(async (taskId: string) => {
    // Store original task for rollback
    const originalTask = tasks.find(t => t.id === taskId);
    if (!originalTask) {
      throw new Error('Task not found');
    }

    // Optimistically toggle status
    dispatch(toggleTaskStatus(taskId));

    const newStatus = originalTask.status === 'completed' ? 'pending' : 'completed';

    try {
      if (isOnline) {
        // Send to server
        await ApiService.updateTask(taskId, { status: newStatus });
      } else {
        // Queue for later
        await offlineQueue.queueRequest('PUT', `/api/tasks/${taskId}`, { status: newStatus });
        console.log('📴 Task status update queued for when online');
      }
    } catch (error: any) {
      // Rollback on error
      dispatch(toggleTaskStatus(taskId)); // Toggle back
      dispatch(setTaskError(error.message || 'Failed to update task status'));
      throw error;
    }
  }, [dispatch, tasks, isOnline]);

  return {
    tasks,
    loading,
    error,
    createTask,
    updateTask: modifyTask,
    deleteTask: removeTask,
    toggleStatus,
    isOnline,
  };
};
