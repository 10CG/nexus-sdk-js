/**
 * Knowledge Service
 */

import { BaseService } from './base';
import type {
  KnowledgeExtractDto,
  KnowledgeExtractResult,
  KnowledgeQueryDto,
  KnowledgeQueryResult,
  Entity,
} from '../types';

/**
 * Knowledge Service API
 */
export class KnowledgeService extends BaseService {
  /**
   * Extract entities and relationships from text
   * @param data - Extraction parameters
   * @returns Extracted entities and relationships
   * @example
   * ```ts
   * const result = await client.knowledge.extract({
   *   text: '张三是李四的上司，他们在北京工作',
   *   owner_id: 'user_123'
   * });
   *
   * console.log(result.entities);  // 张三, 李四
   * console.log(result.relationships);  // 张三 -> 上司 -> 李四
   * ```
   */
  async extract(data: KnowledgeExtractDto): Promise<KnowledgeExtractResult> {
    return this.http.post<KnowledgeExtractResult>('/knowledge/extract', data);
  }

  /**
   * Query knowledge graph
   * @param data - Query parameters
   * @returns Query result with answer and sources
   * @example
   * ```ts
   * const result = await client.knowledge.query({
   *   query: '谁是我的上司？',
   *   user_id: 'user_123'
   * });
   *
   * console.log(result.answer);  // '张三是您的上司'
   * ```
   */
  async query(data: KnowledgeQueryDto): Promise<KnowledgeQueryResult> {
    return this.http.post<KnowledgeQueryResult>('/knowledge/query', data);
  }

  /**
   * Get entities for a user
   * @param userId - User ID
   * @param params - Query parameters
   * @returns Array of entities
   */
  async getEntities(
    userId: string,
    params?: { limit?: number; offset?: number; entity_type?: string },
  ): Promise<Entity[]> {
    return this.http.get<Entity[]>('/knowledge/entities', {
      user_id: userId,
      ...params,
    });
  }
}
