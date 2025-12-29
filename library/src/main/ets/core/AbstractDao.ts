/*
 * Copyright (c) 2022 Huawei Device Co., Ltd.
 *
 * Based on AbstractDao.java written by
 * Copyright (C) 2011-2016 Markus Junginger, greenrobot (http://greenrobot.org)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Database } from './database/Database';
import { DatabaseStatement } from './database/DatabaseStatement';
import { IdentityScope } from './identityscope/IdentityScope';
import { IdentityScopeLong } from './identityscope/IdentityScopeLong';
import { DaoConfig } from './internal/DaoConfig';
import { TableStatements } from './internal/TableStatements';
import { Query } from './query/Query';
import { QueryBuilder } from './query/QueryBuilder';
import { AbstractDaoSession } from './AbstractDaoSession';
import { Constraint, Property } from './Property';
import { SQLiteStatement } from './database/SQLiteStatement';
import { DaoException } from './DaoException';
import { JList } from './common/JList';
import { DaoLog } from './DaoLog';
import { Select } from './dbflow/base/Select';
import { OnTableChangedListener } from './dbflow/listener/OnTableChangedListener'
import { TableAction } from './dbflow/listener/TableAction'
import { ToOneEntity } from './entity/ToOneEntity';
import { Entity } from './entity/Entity';
import { ToManyEntity } from './entity/ToManyEntity';
import { ToManyWithJoinEntity } from './entity/ToManyWithJoinEntity';
import { GlobalContext } from './GlobalContext';
import { ConvertParameter } from './converter/ConvertParameter';
import { Queue } from './common/Queue';
import { DbUtils } from './DbUtils';
import { getClsColumns, getClsTableInfo, IColumn } from './annotation/Util';
import { relationalStore } from '@kit.ArkData';
import { Transaction } from './database/StandardDatabase';
import { DaoTraceSpace, DaoTraceUtil } from './trace/DaoTraceUtil';

/**
 * Base class for all DAOs: Implements entity operations like insert, load, delete, and query.
 * <p>
 * This class is thread-safe.
 *
 * @param <T> Entity type
 * @param <K> Primary key (PK) type; use Void if entity does not have exactly one PK
 * @author Markus
 */
export abstract class AbstractDao<T, K> {
  protected config: DaoConfig;
  protected db: Database;
  protected isStandardSQLite: boolean;
  protected identityScope: IdentityScope<K, T>;
  protected identityScopeLong: IdentityScopeLong<1, T>;
  protected statements: TableStatements;
  protected session: AbstractDaoSession;
  protected pkOrdinal: number;
  protected entityCls: any;
  protected convertEntity;
  protected columnType;
  protected convertColumn;

  public static TABLENAME<T>(t: T): string {
    return getClsTableInfo(t).tableName
  }

  public static INDEXINFO<T>(t: T): Array<{
    name?: string,
    value: string,
    unique: boolean
  }> {
    return getClsTableInfo(t).indexes;
  }

  public setEntityCls(entityCls: T) {
    this.entityCls = entityCls;
  }

  public getEntityCls(): any {
    return this.entityCls;
  }

  constructor(config: DaoConfig, daoSession = null) {
    this.config = config;
    this.session = daoSession;
    this.db = config.db;
    this.isStandardSQLite = true;
    this.identityScope = <IdentityScope<K, T>> config.getIdentityScope();
    if (this.identityScope instanceof IdentityScopeLong) {
      this.identityScopeLong = <IdentityScopeLong<1, T>> this.identityScope;
    } else {
      this.identityScopeLong = null;
    }
    this.statements = config.statements;
    this.pkOrdinal = config.pkProperty ? config.pkProperty.ordinal : -1;
  }

  public getSession(): AbstractDaoSession {
    return this.session;
  }

  getStatements(): TableStatements {
    return this.config.statements;
  }

  public getTableName(): string {
    return this.config.tablename;
  }

  public getProperties(): Property[] {
    return this.config.properties;
  }

  public getPkProperty(): Property {
    return this.config.pkProperty;
  }

  public getAllColumns(): string[] {
    return this.config.allColumns;
  }

  public getPkColumns(): string[] {
    return this.config.pkColumns;
  }

  public getNonPkColumns(): string[] {
    return this.config.nonPkColumns;
  }

  /**
   * Loads the entity for the given PK.
   *
   * @param key a PK value or null
   * @return The entity or null, if no entity matched the PK value
   */
  public async load(key: K): Promise<T> {
    if (key === null || key === undefined) {
      return null;
    }
    if (this.identityScope) {
      let entity: T = this.identityScope.get(key);
      if (entity) {
        return new Promise<T>(resolve => {
          resolve(entity);
        })
      }
    }
    let sql = new relationalStore.RdbPredicates(this.getTableName())
    sql.equalTo(this.getPkColumns()[0], key.toString())
    let cursor = await this.db.rawQuery(sql, this.getAllColumns());
    if (cursor && cursor.goToFirstRow()) {
      return new Promise<T>(resolve => {
        let data = this.loadUniqueAndCloseCursor(cursor);
        if (data) {
          resolve(data);
        } else {
          return undefined;
        }
      })
    } else {
      return undefined;
    }
  }

  public loadSync(key: K): T {
    if (key === null || key === undefined) {
      return null;
    }
    if (this.identityScope) {
      let entity: T = this.identityScope.get(key);
      if (entity) {
        return entity
      }
    }
    let sql = new relationalStore.RdbPredicates(this.getTableName())
    sql.equalTo(this.getPkColumns()[0], key.toString())
    let cursor = this.db.rawQuerySync(sql, this.getAllColumns());
    if (cursor && cursor.goToFirstRow()) {
      let data = this.loadUniqueAndCloseCursor(cursor);
      return data || undefined;
    } else {
      return undefined;
    }
  }

  public async loadByRowId(rowId: number): Promise<T> {
    let sql = this.statements.getSelectAll();
    sql.equalTo("ROWID", rowId.toString());
    let cursor = await this.db.rawQuery(sql, this.getAllColumns());
    return this.loadUniqueAndCloseCursor(cursor);
  }

  public loadByRowIdSync(rowId: number): T {
    let sql = this.statements.getSelectAll();
    sql.equalTo("ROWID", rowId.toString());
    let cursor = this.db.rawQuerySync(sql, this.getAllColumns());
    return this.loadUniqueAndCloseCursor(cursor);
  }

  protected loadUniqueAndCloseCursor(cursor: any): T {
    try {
      return this.loadUnique(cursor);
    } finally {
      if (cursor) {
        cursor.close();
      }
    }
  }

  protected loadUnique(cursor: any): T {
    if (cursor) {
      let available: boolean = cursor.goToFirstRow();
      if (!available) {
        return undefined;
      }
      return this.loadCurrent(cursor, 0, true);
    } else {
      return undefined;
    }
  }

  /** Loads all available entities from the database. */
  public async loadAll(): Promise<Array<T>> {
    let cursor = await this.db.rawQuery(this.statements.getSelectAll(), this.getAllColumns());
    return this.loadAllAndCloseCursor(cursor);
  }


  /** Loads all available entities from the database. */
  public loadAllSync(): Array<T> {
    let cursor = this.db.rawQuerySync(this.statements.getSelectAll(), this.getAllColumns());
    return this.loadAllAndCloseCursor(cursor);
  }

  /**
   * @deprecated since 2.1.1
   * @useinstead AbstractDao#loadAllsAsync
   */
  public loadAlls() {
    // @ts-ignore
    let cursor: ResultSet = this.db.rawQueries(this.getSelectDeep(entity), this.getAllColumns());
    return this.loadAllAndCloseCursor(cursor);
  }

  public async loadAllsAsync() {
    // @ts-ignore
    let cursor: ResultSet = await this.db.rawQueries(this.getSelectDeep(entity), this.getAllColumns());
    return this.loadAllAndCloseCursor(cursor);

  }
  
  public loadAllsSync() {
    // @ts-ignore
    let cursor: ResultSet = this.db.rawQueriesSync(this.getSelectDeep(entity), this.getAllColumns());
    return this.loadAllAndCloseCursor(cursor);

  }

  /** Detaches an entity from the identity scope (session). Subsequent query results won't return this object. */
  public detach(entity: T): boolean {
    if (this.identityScope) {
      let key: K = this.getKeyVerified(entity);
      return this.identityScope.detach(key, entity);
    } else {
      return false;
    }
  }

  /**
   * Detaches all entities (of type T) from the identity scope (session). Subsequent query results won't return any
   * previously loaded objects.
   */
  public detachAll(): void {
    this.identityScope?.clear();
  }

  protected loadAllAndCloseCursor(cursor: any): Array<T> {
    try {
      return this.loadAllFromCursor(cursor);
    } finally {
      if (cursor) {
        cursor.close();
      }
    }
  }

  /**
   * Inserts the given entities in the database using a transaction.
   *
   * @param entities The entities to insert.
   * @deprecated since 2.1.1
   * @useinstead AbstractDao#insertInTxIterableAsync
   */
  public insertInTxIterable(entities: Iterable<T>): void {
    this.insertInTx(entities, this.isEntityUpdateAble());
  }

  /**
   * Inserts the given entities in the database using a transaction.
   *
   * @param entities The entities to insert.
   */
  public async insertInTxIterableAsync(entities: Iterable<T>): Promise<void> {
    await this.insertInTxAsync(entities, this.isEntityUpdateAble());
  }
  public insertInTxIterableSync(entities: Iterable<T>): void {
    this.insertInTxSync(entities, this.isEntityUpdateAble());
  }

  /**
   * Inserts the given entities in the database using a transaction.
   *
   * @param entities The entities to insert.
   * @deprecated since 2.1.1
   * @useinstead AbstractDao#insertInTxArrAsync
   */
  public insertInTxArr(...entities: any[]): void {
    this.insertInTx(entities, this.isEntityUpdateAble());
  }

  /**
   * Inserts the given entities in the database using a transaction.
   *
   * @param entities The entities to insert.
   */
  public async insertInTxArrAsync(...entities: any[]): Promise<void> {
    await this.insertInTxAsync(entities, this.isEntityUpdateAble());
  }

  public insertInTxArrSync(...entities: any[]): void {
     this.insertInTxSync(entities, this.isEntityUpdateAble());
  }

  /**
   * Inserts the given entities in the database using a transaction. The given entities will become tracked if the PK
   * is set.
   *
   * @param entities      The entities to insert.
   * @param setPrimaryKey if true, the PKs of the given will be set after the insert; pass false to improve
   *                      performance.
   * @deprecated since 2.1.1
   * @useinstead AbstractDao#insertInTxAsync
   */
  public insertInTx(entities: Iterable<T>, setPrimaryKey: boolean): void {
    let stmt: DatabaseStatement = this.statements.getInsertStatement();
    this.executeInsertInTx(null, stmt, entities, setPrimaryKey);
  }

  /**
   * Inserts the given entities in the database using a transaction. The given entities will become tracked if the PK
   * is set.
   *
   * @param entities      The entities to insert.
   * @param setPrimaryKey if true, the PKs of the given will be set after the insert; pass false to improve
   *                      performance.
   */
  public async insertInTxAsync(entities: Iterable<T>,
    setPrimaryKey: boolean): Promise<void> {
    let stmt: DatabaseStatement = this.statements.getInsertStatement();
    await this.executeInsertInTx(null, stmt, entities, setPrimaryKey);
  }
  public insertInTxSync(entities: Iterable<T>,
    setPrimaryKey: boolean) {
    let stmt: DatabaseStatement = this.statements.getInsertStatement();
    this.executeInsertInTxSync(null, stmt, entities);
  }

  /**
   * Inserts or replaces the given entities in the database using a transaction. The given entities will become
   * tracked if the PK is set.
   *
   * @param entities      The entities to insert.
   * @param setPrimaryKey if true, the PKs of the given will be set after the insert; pass false to improve
   *                      performance.
   * @deprecated since 2.1.1
   * @useinstead AbstractDao#insertOrReplaceInTxAsync
   */
  public insertOrReplaceInTx(entities: Iterable<T>,
    setPrimaryKey: boolean): void {
    let stmt: DatabaseStatement = this.statements.getInsertOrReplaceStatement();
    this.executeInsertInTx(null, stmt, entities, setPrimaryKey);
  }

  /**
   * Inserts or replaces the given entities in the database using a transaction. The given entities will become
   * tracked if the PK is set.
   *
   * @param entities      The entities to insert.
   * @param setPrimaryKey if true, the PKs of the given will be set after the insert; pass false to improve
   *                      performance.
   */
  public async insertOrReplaceInTxAsync(entities: Iterable<T>,
    setPrimaryKey: boolean): Promise<void> {
    let stmt: DatabaseStatement = this.statements.getInsertOrReplaceStatement();
    await this.executeInsertInTx(null, stmt, entities, setPrimaryKey);
  }

  public insertOrReplaceInTxSync(entities: Iterable<T>): void {
    let stmt: DatabaseStatement = this.statements.getInsertOrReplaceStatement();
    this.executeInsertInTxSync(null, stmt, entities);
  }

  // todo 对应原insertOrReplaceInTx
  /**
   * Inserts or replaces the given entities in the database using a transaction.
   *
   * @param entities The entities to insert.
   * @deprecated since 2.1.1
   * @useinstead AbstractDao#insertOrReplaceInTxIterableAsync
   */
  public insertOrReplaceInTxIterable(entities: Iterable<T>): void {
    this.insertOrReplaceInTx(entities, this.isEntityUpdateAble());
  }

  /**
   * Inserts or replaces the given entities in the database using a transaction.
   * Suggest setting setPrimaryKey to false to improve performance
   * @param entities The entities to insert.
   */
  public async insertOrReplaceInTxIterableAsync(entities: Iterable<T>, setPrimaryKey?: boolean): Promise<void> {
    await this.insertOrReplaceInTxAsync(entities, setPrimaryKey ?? this.isEntityUpdateAble());
  }
  
  public insertOrReplaceInTxIterableSync(entities: Iterable<T>): void {
     this.insertOrReplaceInTxSync(entities);
  }

  /**
   * Inserts or replaces the given entities in the database using a transaction.
   *
   * @param entities The entities to insert.
   * @deprecated since 2.1.1
   * @useinstead AbstractDao#insertOrReplaceInTxArrAsync
   */
  public insertOrReplaceInTxArr(...entities: any[]): void {
    this.insertOrReplaceInTx(entities, this.isEntityUpdateAble());
  }

  /**
   * Inserts or replaces the given entities in the database using a transaction.
   * Suggest using insertOrReplaceInTxAsync and passing false in setPrimaryKey to improve performance
   *
   * @param entities The entities to insert.
   */
  public async insertOrReplaceInTxArrAsync(...entities: any[]): Promise<void> {
    let entity = entities.flat(Infinity);
    await this.insertOrReplaceInTxAsync(entity, this.isEntityUpdateAble());
  }
  
  public insertOrReplaceInTxArrSync(...entities: any[]):void {
    let entity = entities.flat(Infinity);
    this.insertOrReplaceInTxSync(entity);
  }


  private async executeInsertInTxWithFor(stmt: DatabaseStatement, entities: Iterable<T>) {

    try {
      DaoTraceUtil.startInfo("AbstractDao.insertBatchWithFor", DaoTraceSpace.TraceType.CRUD);
      this.db.beginTransaction();
      if (this.isStandardSQLite) {
        let rawStmt: SQLiteStatement = stmt.getRawStatement();
        for (let entity of entities) {
          this.bindValues(rawStmt, entity)
          let rowId: number = await rawStmt.executeInsert(null, relationalStore.ConflictResolution.ON_CONFLICT_REPLACE);
          this.updateKeyAfterInsertAndAttach(entity, rowId, false);
        }
      } else {
        for (let entity of entities) {
          this.bindValues(stmt, entity)
          let rowId: number = await stmt.executeInsert(null);
          this.updateKeyAfterInsertAndAttach(entity, rowId, false);
        }
      }
      this.db.endTransaction();
    } catch (e) {
      DaoLog.e("err_msg:" + e.message, e.stack)
      this.db.rollBack()
    } finally {
      DaoTraceUtil.finish("AbstractDao.insertBatchWithFor");
    }
  }

  private async executeInsertInTx(transaction: Transaction | null, stmt: DatabaseStatement,
    entities: Iterable<T>, setPrimaryKey: boolean) {
    if (setPrimaryKey) {
      // 兼容旧版本的for循环执行批量中有个key回写的功能
      return await this.executeInsertInTxWithFor(stmt, entities);
    }
    try {
      DaoTraceUtil.startInfo("AbstractDao.insertBatch", DaoTraceSpace.TraceType.CRUD);
      if (this.isStandardSQLite) {
        let rawStmt: SQLiteStatement = stmt.getRawStatement();
        this.bindValuesArray(rawStmt, [...entities])
        await rawStmt.executeInsertBatch(transaction)
      } else {
        this.bindValuesArray(stmt, [...entities]);
        await stmt.executeInsertBatch(transaction);
      }
      await this.db.endTransactionAsync(transaction)
    } catch (e) {
      DaoTraceUtil.startError("AbstractDao.insertBatch.error", DaoTraceSpace.TraceType.CRUD);
      DaoLog.e("err_msg:" + e.message, e.stack)
      await this.db.rollBackAsync(transaction)
      DaoTraceUtil.finish("AbstractDao.insertBatch.error");
    } finally {
      DaoTraceUtil.finish("AbstractDao.insertBatch");
    }
  }

  private executeInsertInTxSync(transaction: Transaction | null, stmt: DatabaseStatement,
    entities: Iterable<T>) {
    try {
      DaoTraceUtil.startInfo("AbstractDao.insertBatchSync", DaoTraceSpace.TraceType.CRUD);
      if (this.isStandardSQLite) {
        let rawStmt: SQLiteStatement = stmt.getRawStatement();
        this.bindValuesArray(rawStmt, [...entities])
        rawStmt.executeInsertBatchSync(transaction)
      } else {
        this.bindValuesArray(stmt, [...entities]);
        stmt.executeInsertBatchSync(transaction);
      }
    } catch (e) {
      DaoTraceUtil.startError("AbstractDao.insertBatchSync.error", DaoTraceSpace.TraceType.CRUD);
      DaoLog.e("err_msg:" + e.message, e.stack)
      DaoTraceUtil.finish("AbstractDao.insertBatchSync.error");
    } finally {
      DaoTraceUtil.finish("AbstractDao.insertBatchSync");
    }
  }

  /**
   * Insert an entity into the table associated with a concrete DAO.
   *
   * @return row ID of newly inserted entity
   */
  public async insert(entity: T): Promise<number> {
    return await this.executeInsert(entity, this.statements.getInsertStatement(), true);
  }

  public insertSync(entity: T):number {
    return this.executeInsertSync(entity, this.statements.getInsertStatement(), true);
  }

  /**
   * Insert an entity into the table associated with a concrete DAO <b>without</b> setting key property.
   * <p>
   * Warning: This may be faster, but the entity should not be used anymore. The entity also won't be attached to
   * identity scope.
   *
   * @return row ID of newly inserted entity
   */
  public async insertWithoutSettingPk(entity: T): Promise<number> {
    return await this.executeInsert(entity, this.statements.getInsertOrReplaceStatement(), false);
  }
  
  public insertWithoutSettingPkSync(entity: T): number {
    return this.executeInsertSync(entity, this.statements.getInsertOrReplaceStatement(), false);
  }

  /**
   * Insert an entity into the table associated with a concrete DAO.
   *
   * @return row ID of newly inserted entity
   */
  public async insertOrReplace(entity: T, setKeyAndAttach: boolean = true): Promise<number> {
    return await this.executeInsert(entity, this.statements.getInsertOrReplaceStatement(), setKeyAndAttach,
      relationalStore.ConflictResolution.ON_CONFLICT_REPLACE);
  }

  public insertOrReplaceSync(entity: T, setKeyAndAttach: boolean = true): number {
    return this.executeInsertSync(entity, this.statements.getInsertOrReplaceStatement(), setKeyAndAttach,
      relationalStore.ConflictResolution.ON_CONFLICT_REPLACE);
  }
  private executeInsertSync(entity: T, stmt: DatabaseStatement, setKeyAndAttach: boolean,
    conflictResolution?: relationalStore.ConflictResolution): number {
    let rowId: number;
    let err;
    try {
      rowId = this.insertInsideTxSync(null, entity, stmt, conflictResolution);
    } catch (e) {
      DaoLog.e(e.message, e.stack)
      err = e;
    }
    if (err) {
      throw err;
    }
    if (setKeyAndAttach) {
      this.updateKeyAfterInsertAndAttach(entity, rowId, true);
    }
    return rowId;
  }


  private async executeInsert(entity: T, stmt: DatabaseStatement, setKeyAndAttach: boolean,
    conflictResolution?: relationalStore.ConflictResolution): Promise<number> {
    DaoTraceUtil.startInfo("AbstractDao.insert", DaoTraceSpace.TraceType.CRUD);
    let rowId: number;
    let err;
    try {
      rowId = await this.insertInsideTx(null, entity, stmt, conflictResolution);
    } catch (e) {
      DaoTraceUtil.startError("AbstractDao.insert.error", DaoTraceSpace.TraceType.CRUD);
      DaoLog.e(e.message, e.stack)
      err = e;
      DaoTraceUtil.finish("AbstractDao.insert.error");
    }
    if (err) {
      throw err;
    }
    if (setKeyAndAttach) {
      this.updateKeyAfterInsertAndAttach(entity, rowId, true);
    }
    DaoTraceUtil.finish("AbstractDao.insert");
    return rowId;
  }

  private async insertInsideTx(transaction: Transaction | null, entity: T, stmt: DatabaseStatement,
    conflictResolution?: relationalStore.ConflictResolution): Promise<number> {
    if (this.isStandardSQLite) {
      let rawStmt: SQLiteStatement = stmt.getRawStatement();
      this.bindValues(rawStmt, entity);
      return await rawStmt.executeInsert(transaction, conflictResolution);
    } else {
      this.bindValues(stmt, entity);
      return await stmt.executeInsert(conflictResolution);
    }
  }

  private insertInsideTxSync(transaction: Transaction | null, entity: T, stmt: DatabaseStatement,
    conflictResolution?: relationalStore.ConflictResolution): number {
    if (this.isStandardSQLite) {
      let rawStmt: SQLiteStatement = stmt.getRawStatement();
      this.bindValues(rawStmt, entity);
      return rawStmt.executeInsertSync(transaction, conflictResolution);
    } else {
      this.bindValues(stmt, entity);
      return stmt.executeInsertSync(conflictResolution);
    }
  }

  protected updateKeyAfterInsertAndAttach(entity: T, rowId: number, lock: boolean): void {
    if (rowId !== -1) {
      let key: K = this.updateKeyAfterInsert(entity, rowId);
      this.attachEntityM(key, entity, lock);
    } else {
      // TODO When does this actually happen? Should we throw instead?
      DaoLog.w("Could not insert row (executeInsert returned -1)");
    }
  }

  /**
   * "Saves" an entity to the database: depending on the existence of the key property, it will be inserted
   * (key is null) or updated (key is not null).
   * <p>
   * This is similar to {@link #insertOrReplace(Object)}, but may be more efficient, because if a key is present,
   * it does not have to query if that key already exists.
   * @deprecated since 2.1.1
   * @useinstead AbstractDao#saveAsync
   */
  public save(entity: T): void {
    if (this.hasKey(entity)) {
      this.update(entity);
    } else {
      this.insert(entity);
    }
  }

  /**
   * "Saves" an entity to the database: depending on the existence of the key property, it will be inserted
   * (key is null) or updated (key is not null).
   * <p>
   * This is similar to {@link #insertOrReplace(Object)}, but may be more efficient, because if a key is present,
   * it does not have to query if that key already exists.
   */
  public async saveAsync(entity: T): Promise<void> {
    if (this.hasKey(entity)) {
      await this.updateAsync(entity);
    } else {
      await this.insert(entity);
    }
  }

  public saveSync(entity: T): void {
    if (this.hasKey(entity)) {
      this.updateSync(entity);
    } else {
      this.insertSync(entity);
    }
  }

  /**
   * Saves (see {@link #save(Object)}) the given entities in the database using a transaction.
   *
   * @param entities The entities to save.
   * @deprecated since 2.1.1
   * @useinstead AbstractDao#saveInTxAAsync
   */
  public saveInTxA(...entities: any[]): void {
    this.saveInTx(entities);
  }

  /**
   * Saves (see {@link #save(Object)}) the given entities in the database using a transaction.
   *
   * @param entities The entities to save.
   */
  public async saveInTxAAsync(...entities: any[]): Promise<void> {
    await this.saveInTxAsync(entities);
  }
  public saveInTxASync(...entities: any[]): void {
    this.saveInTxSync(entities);
  }

  /**
   * Saves (see {@link #save(Object)}) the given entities in the database using a transaction.
   *
   * @param entities The entities to save.
   * @deprecated since 2.1.1
   * @useinstead AbstractDao#saveInTxAsync
   */
  public async saveInTx(entities: Iterable<T>): Promise<void> {
    let updateCount: number = 0;
    let insertCount: number = 0;
    for (let entity of entities) {
      if (this.hasKey(entity)) {
        updateCount++;
      } else {
        insertCount++;
      }
    }
    if (updateCount > 0 && insertCount > 0) {
      let toUpdate: JList<T> = new JList();
      let toInsert: JList<T> = new JList();
      for (let entity of entities) {
        if (this.hasKey(entity)) {
          toUpdate.insert(entity);
        } else {
          toInsert.insert(entity);
        }
      }

      let transaction = await this.db.beginTransactionAsync();
      try {
        this.updateInTx(transaction, toUpdate.dataSource);
        this.insertInTxIterable(toInsert.dataSource);
        await this.db.endTransactionAsync(transaction);
      } catch (e) {
        DaoTraceUtil.startError("AbstractDao.saveInTx.error", DaoTraceSpace.TraceType.CRUD);
        DaoLog.e(e.message, e.stack)
        await this.db.rollBackAsync(transaction)
        DaoTraceUtil.finish("AbstractDao.saveInTx.error");
      }
    } else if (insertCount > 0) {
      this.insertInTxIterable(entities);
    } else if (updateCount > 0) {
      this.updateInTx(null, entities);
    }
  }

  /**
   * Saves (see {@link #save(Object)}) the given entities in the database using a transaction.
   *
   * @param entities The entities to save.
   */
  public async saveInTxAsync(entities: Iterable<T>): Promise<void> {
    let updateCount: number = 0;
    let insertCount: number = 0;
    for (let entity of entities) {
      if (this.hasKey(entity)) {
        updateCount++;
      } else {
        insertCount++;
      }
    }
    if (updateCount > 0 && insertCount > 0) {
      let toUpdate: JList<T> = new JList();
      let toInsert: JList<T> = new JList();
      for (let entity of entities) {
        if (this.hasKey(entity)) {
          toUpdate.insert(entity);
        } else {
          toInsert.insert(entity);
        }
      }

      let transaction = await this.db.beginTransactionAsync();
      try {
        await this.updateInTxAsync(toUpdate.dataSource);
        await this.insertInTxIterableAsync(toInsert.dataSource);
        await this.db.endTransactionAsync(transaction);
      } catch (e) {
        DaoTraceUtil.startError("AbstractDao.saveInTxAsync.error", DaoTraceSpace.TraceType.CRUD);
        DaoLog.e(e.message, e.stack)
        await this.db.rollBackAsync(transaction);
        DaoTraceUtil.finish("AbstractDao.saveInTxAsync.error");
      }
    } else if (insertCount > 0) {
      await this.insertInTxIterableAsync(entities);
    } else if (updateCount > 0) {
      await this.updateInTxAsync(entities);
    }
  }

  public saveInTxSync(entities: Iterable<T>): void {
    let updateCount: number = 0;
    let insertCount: number = 0;
    for (let entity of entities) {
      if (this.hasKey(entity)) {
        updateCount++;
      } else {
        insertCount++;
      }
    }
    if (updateCount > 0 && insertCount > 0) {
      let toUpdate: JList<T> = new JList();
      let toInsert: JList<T> = new JList();
      for (let entity of entities) {
        if (this.hasKey(entity)) {
          toUpdate.insert(entity);
        } else {
          toInsert.insert(entity);
        }
      }

      try {
        this.updateInTxSync(toUpdate.dataSource);
        this.insertInTxIterableSync(toInsert.dataSource);
      } catch (e) {
        DaoTraceUtil.startError("AbstractDao.saveInTxSync.error", DaoTraceSpace.TraceType.CRUD);
        DaoLog.e(e.message, e.stack)
        DaoTraceUtil.finish("AbstractDao.saveInTxSync.error");
      }
    } else if (insertCount > 0) {
      this.insertInTxIterableSync(entities);
    } else if (updateCount > 0) {
      this.updateInTxSync(entities);
    }
  }

  /**
   * 将游标转换为实体列表 是否需要关闭游标
   * @param cursor 游标
   * @param needClose 是否需要关闭游标
   * @returns 实体列表
   */
  public convertCursor2Entity(cursor: any, needClose: boolean = false): Array<T> {
    if (needClose) {
      return this.loadAllAndCloseCursor(cursor);
    }
    return this.loadAllFromCursor(cursor);
  }


  /** Reads all available rows from the given cursor and returns a JList of entities. */
  protected loadAllFromCursor(cursor: relationalStore.ResultSet): Array<T> {
    DaoTraceUtil.startInfo("AbstractDao.query", DaoTraceSpace.TraceType.CRUD);
    let count: number = cursor.rowCount;
    if (count === 0) {
      return new JList<T>().dataSource;
    }
    let list: JList<T> = new JList<T>();
    if (cursor && cursor.goToFirstRow()) {
      do {
        list.insert(this.loadCurrent(cursor, 0, false));
      } while (cursor.goToNextRow());
    }
    DaoTraceUtil.finish("AbstractDao.query")
    DaoLog.i(`query result:${DaoLog.stringify(list.dataSource)}`);
    return list.dataSource;
  }

  /** Internal use only. Considers identity scope. */
  protected loadCurrent(cursor: relationalStore.ResultSet, offset: number, lock: boolean, isDeep = false): T {
    if (this.identityScopeLong) {
      if (offset !== 0) {
        // Occurs with deep loads (left outer joins)
        if (cursor.isColumnNull(this.pkOrdinal + offset)) {
          return null;
        }
      }
      let key: number = cursor.getLong(this.pkOrdinal + offset);
      let entity: T = this.identityScopeLong.get2(key);
      if (entity) {
        return entity;
      } else {
        entity = this.readEntity(cursor, offset, isDeep);
        this.attachEntity(entity);
        this.identityScopeLong.put2(key, entity);
        return entity;
      }
    } else if (this.identityScope) {
      let entity: T = this.readEntity(cursor, offset, isDeep);
      return entity;
    } else {
      // Check offset, assume a value !=0 indicating a potential outer join, so check PK
      if (offset !== 0) {
        let key: K = this.readKey(cursor, offset);
        if (key === null || key === undefined) {
          // Occurs with deep loads (left outer joins)
          return null;
        }
      }

      let entity: T = this.readEntity(cursor, offset, isDeep);
      this.attachEntity(entity);
      return entity;
    }
  }

  /** Internal use only. Considers identity scope. */
  protected loadCurrentOther<O>(dao: AbstractDao<O, any>, cursor: any, offset: number, isDeep = false): O {
    return dao.loadCurrent(cursor, offset, /* TODO check this */
      true, isDeep);
  }

  /** A raw-style query where you can pass any WHERE clause and arguments. */
  public async queryRaw(where: string, ...selectionArg: string[]): Promise<Array<T>> {
    // @ts-ignore
    let cursor: ResultSet = await this.db.rawQuery(this.statements.getSelectAll() + where, selectionArg);
    return this.loadAllAndCloseCursor(cursor);
  }

  public queryRawSync(where: string, ...selectionArg: string[]): Array<T> {
    // @ts-ignore
    let cursor: ResultSet = this.db.rawQuerySync(this.statements.getSelectAll() + where, selectionArg);
    return this.loadAllAndCloseCursor(cursor);
  }

  /**
   * Creates a repeatable {@link Query} object based on the given raw SQL where you can pass any WHERE clause and
   * arguments.
   */
  public queryRawCreate(where: string, ...selectionArg: any[]): Query<T> {
    return this.queryRawCreateListArgs(where, selectionArg);
  }


  /**
   * Creates a repeatable {@link Query} object based on the given raw SQL where you can pass any WHERE clause and
   * arguments.
   */
  public queryRawCreateListArgs(where: string, selectionArg: any[]): Query<T> {
    return Query.internalCreate(this, null, selectionArg);
  }

  /**
   * @deprecated since 2.1.1
   * @useinstead AbstractDao#deleteAllAsync
   */
  public deleteAll(): void {
    this.db.execSQL("DELETE FROM '" + this.config.tablename + "'");
    this.identityScope?.clear();
  }

  public async deleteAllAsync(): Promise<void> {
    await this.db.execSQL("DELETE FROM '" + this.config.tablename + "'");
    this.identityScope?.clear();
  }

  /**
   * Deletes the given entity from the database. Currently, only single value PK entities are supported.
   * @deprecated since 2.1.1
   * @useinstead AbstractDao#deleteAsync
   * */
  public delete(entity: T): void {
    this.assertSinglePk();
    let key: K = this.getKeyVerified(entity);
    this.deleteByKey(key);
  }

  public deleteSync(entity: T): void {
    this.assertSinglePk();
    let key: K = this.getKeyVerified(entity);
    this.deleteByKeySync(key);
  }

  /**
   * Deletes the given entity from the database. Currently, only single value PK entities are supported.
   * */
  public async deleteAsync(entity: T): Promise<void> {
    this.assertSinglePk();
    let key: K = this.getKeyVerified(entity);
    await this.deleteByKeyAsync(key);
  }

  /**
   * Deletes an entity with the given PK from the database. Currently, only single value PK entities are supported.
   * @deprecated since 2.1.1
   * @useinstead AbstractDao#deleteByKeyAsync
   * */
  public async deleteByKey(key: K): Promise<void> {

    let stmt: DatabaseStatement = this.statements.getDeleteStatement();
    let err;
    let transaction = await this.db.beginTransactionAsync();
    try {
      this.deleteByKeyInsideSynchronized(transaction, key, stmt);
      await this.db.endTransactionAsync(transaction);
    } catch (e) {
      DaoTraceUtil.startError("AbstractDao.deleteByKey.error", DaoTraceSpace.TraceType.CRUD);
      DaoLog.e(e.message, e.stack)
      await this.db.rollBackAsync(transaction)
      err = e;
      DaoTraceUtil.finish("AbstractDao.deleteByKey.error");
    }
    if (err) {
      throw err;
    }
    this.identityScope?.remove(key);
  }

  /**
   * Deletes an entity with the given PK from the database. Currently, only single value PK entities are supported.
   * */
  public async deleteByKeyAsync(key: K): Promise<void> {
    let stmt: DatabaseStatement = this.statements.getDeleteStatement();
    try {
      await this.deleteByKeyInsideAsync(null, [key], stmt);
    } catch (e) {
      DaoTraceUtil.startError("AbstractDao.deleteByKeyAsync.error", DaoTraceSpace.TraceType.CRUD);
      DaoLog.e(e.message, e.stack)
      DaoTraceUtil.finish("AbstractDao.deleteByKeyAsync.error");
    }
    this.identityScope?.remove(key);
  }

  public deleteByKeySync(key: K): void {
    let stmt: DatabaseStatement = this.statements.getDeleteStatement();
    let err;
    try {
      this.deleteByKeyInsideSync(null, [key], stmt);
    } catch (e) {
      DaoLog.e(e.message, e.stack)
      err = e;
    }
    if (err) {
      throw err;
    }
    this.identityScope?.remove(key);
  }

  /**
   * @deprecated since 2.1.1
   * @useinstead AbstractDao#deleteByKeyInsideAsync
   */
  private deleteByKeyInsideSynchronized(transaction: Transaction | null, key: any,
    stmt: DatabaseStatement): void {
    stmt.clearBindings();
    if (key === null || key === undefined) {
      throw new DaoException("Cannot delete entity, key is null");
    }
    let predicates = new relationalStore.RdbPredicates(this.getTableName())
    if (stmt instanceof SQLiteStatement) {
      stmt.sql = predicates;
      stmt.sql.equalTo(this.getPkColumns()[0], key.toString());
    } else {
      stmt.getRawStatement().sql = predicates;
      stmt.getRawStatement().sql.equalTo(this.getPkColumns()[0], key.toString());
    }
    stmt.executeDelete(transaction);

  }

  private async deleteByKeyInsideAsync(transaction: Transaction | null, keys: any[],
    stmt: DatabaseStatement): Promise<void> {
    stmt.clearBindings();
    if (keys === null || keys === undefined) {
      throw new DaoException("Cannot delete entity, key is null");
    }
    let predicates = new relationalStore.RdbPredicates(this.getTableName())
    if (stmt instanceof SQLiteStatement) {
      stmt.sql = predicates;
      stmt.sql.in(this.getPkColumns()[0], keys);
    } else {
      stmt.getRawStatement().sql = predicates;
      stmt.getRawStatement().sql.in(this.getPkColumns()[0], keys);
    }
    await stmt.executeDelete(transaction);

  }

  private deleteByKeyInsideSync(transaction: Transaction | null, keys: any[],
    stmt: DatabaseStatement): void {
    stmt.clearBindings();
    if (keys === null || keys === undefined) {
      throw new DaoException("Cannot delete entity, key is null");
    }
    let predicates = new relationalStore.RdbPredicates(this.getTableName())
    if (stmt instanceof SQLiteStatement) {
      stmt.sql = predicates;
      stmt.sql.in(this.getPkColumns()[0], keys);
    } else {
      stmt.getRawStatement().sql = predicates;
      stmt.getRawStatement().sql.in(this.getPkColumns()[0], keys);
    }
    stmt.executeDeleteSync(transaction);

  }

  /**
   * @deprecated since 2.1.1
   * @useinstead AbstractDao#deleteInTxInternalAsync
   */
  private async deleteInTxInternal(entities: Iterable<T>, keys: Iterable<K>): Promise<void> {
    this.assertSinglePk();
    let stmt: DatabaseStatement = this.statements.getDeleteStatement();
    let keysToRemoveFromIdentityScope: JList<K> = null;
    let err;
    let transaction = await this.db.beginTransactionAsync();
    try {
      {
        if (this.identityScope) {
          keysToRemoveFromIdentityScope = new JList<K>();
        }
        if (entities) {
          for (let entity of entities) {
            let key: K = this.getKeyVerified(entity);
            this.deleteByKeyInsideSynchronized(transaction, key, stmt);
            if (keysToRemoveFromIdentityScope) {
              keysToRemoveFromIdentityScope.insert(key);
            }
          }
        }
        if (keys) {
          for (let key of keys) {
            this.deleteByKeyInsideSynchronized(transaction, key, stmt);
            if (keysToRemoveFromIdentityScope) {
              keysToRemoveFromIdentityScope.insert(key);
            }
          }
        }
        await this.db.endTransactionAsync(transaction);
      }
      if (keysToRemoveFromIdentityScope && this.identityScope) {
        for (let i = 0; i < keysToRemoveFromIdentityScope.listSize; i++) {
          this.identityScope.remove(keysToRemoveFromIdentityScope[i]);
        }
      }
    } catch (e) {
      DaoTraceUtil.startError("AbstractDao.deleteInTxInternal.error", DaoTraceSpace.TraceType.CRUD);
      DaoLog.e(e.message, e.stack)
      await this.db.rollBackAsync(transaction)
      err = e;
      DaoTraceUtil.finish("AbstractDao.deleteInTxInternal.error");
    }
    if (err) {
      throw err;
    }
  }

  private async deleteInTxInternalAsync(entities: Iterable<T>, keys: Iterable<K>): Promise<void> {
    if (Array.from(entities ?? []).length === 0 && Array.from(keys ?? []).length === 0) {
      return;
    }
    this.assertSinglePk();
    let stmt: DatabaseStatement = this.statements.getDeleteStatement();
    let keysToRemoveFromIdentityScope: JList<K> = null;
    let err;
    let transaction = await this.db.beginTransactionAsync();
    try {
      {
        if (this.identityScope) {
          keysToRemoveFromIdentityScope = new JList<K>();
        }
        if (entities) {
          let ks = [...entities].map(entity => {
            let key: K = this.getKeyVerified(entity)
            keysToRemoveFromIdentityScope?.insert(key);
            return key;
          });
          await this.deleteByKeyInsideAsync(transaction, ks, stmt);
        }
        if (keys) {
          for (let key of keys) {
            keysToRemoveFromIdentityScope?.insert(key);
          }
          await this.deleteByKeyInsideAsync(transaction, [...keys], stmt);
        }
        await this.db.endTransactionAsync(transaction);
      }
      if (keysToRemoveFromIdentityScope && this.identityScope) {
        for (let i = 0; i < keysToRemoveFromIdentityScope.listSize; i++) {
          this.identityScope.remove(keysToRemoveFromIdentityScope[i]);
        }
      }

    } catch (e) {
      DaoTraceUtil.startError("AbstractDao.deleteInTxInternalAsync.error", DaoTraceSpace.TraceType.CRUD);
      DaoLog.e(e.message, e.stack)
      await this.db.rollBackAsync(transaction)
      err = e;
      DaoTraceUtil.finish("AbstractDao.deleteInTxInternalAsync.error");
    }
    if (err) {
      throw err;
    }
  }


  private deleteInTxInternalSync(entities: Iterable<T>, keys: Iterable<K>): void {
    if (Array.from(entities ?? []).length === 0 && Array.from(keys ?? []).length === 0) {
      return;
    }
    this.assertSinglePk();
    let stmt: DatabaseStatement = this.statements.getDeleteStatement();
    let keysToRemoveFromIdentityScope: JList<K> = null;
    this.db.beginTransaction();
    try {
      {
        if (this.identityScope) {
          keysToRemoveFromIdentityScope = new JList<K>();
        }
        if (entities) {
          let ks = [...entities].map(entity => {
            let key: K = this.getKeyVerified(entity)
            keysToRemoveFromIdentityScope?.insert(key);
            return key;
          });
          this.deleteByKeyInsideSync(null, ks, stmt);
        }
        if (keys) {
          for (let key of keys) {
            keysToRemoveFromIdentityScope?.insert(key);
          }
          this.deleteByKeyInsideSync(null, [...keys], stmt);
        }
        this.db.endTransaction();
      }
      if (keysToRemoveFromIdentityScope && this.identityScope) {
        for (let i = 0; i < keysToRemoveFromIdentityScope.listSize; i++) {
          this.identityScope.remove(keysToRemoveFromIdentityScope[i]);
        }
      }
    } catch (e) {
      DaoTraceUtil.startError("AbstractDao.deleteInTxInternalSync.error", DaoTraceSpace.TraceType.CRUD);
      DaoLog.e(e.message, e.stack)
      this.db.rollBack()
      DaoTraceUtil.finish("AbstractDao.deleteInTxInternalSync.error");
    }
  }

  /**
   * Deletes the given entities in the database using a transaction.
   *
   * @param entities The entities to delete.
   * @deprecated since 2.1.1
   * @useinstead AbstractDao#deleteInTxIterableAsync
   */
  public deleteInTxIterable(entities: Iterable<T>): void {
    this.deleteInTxInternal(entities, null);
  }

  /**
   * Deletes the given entities in the database using a transaction.
   *
   * @param entities The entities to delete.
   */
  public async deleteInTxIterableAsync(entities: Iterable<T>): Promise<void> {
    await this.deleteInTxInternalAsync(entities, null);
  }

  public deleteInTxIterableSync(entities: Iterable<T>): void {
    this.deleteInTxInternalSync(entities, null);
  }

  /**
   * Deletes the given entities in the database using a transaction.
   *
   * @param entities The entities to delete.
   * @deprecated since 2.1.1
   * @useinstead AbstractDao#deleteInTxArrAsync
   */
  public deleteInTxArr(...entities: any[]): void {
    this.deleteInTxInternal(entities, null);
  }

  /**
   * Deletes the given entities in the database using a transaction.
   *
   * @param entities The entities to delete.
   */
  public async deleteInTxArrAsync(...entities: any[]): Promise<void> {
    entities = entities.flat(Infinity);
    await this.deleteInTxInternalAsync(entities, null);
  }

  public deleteInTxArrSync(...entities: any[]): void {
    entities = entities.flat(Infinity);
    this.deleteInTxInternalSync(entities, null);
  }

  /**
   * Deletes all entities with the given keys in the database using a transaction.
   *
   * @param keys Keys of the entities to delete.
   * @deprecated since 2.1.1
   * @useinstead AbstractDao#deleteByKeyInTxIterableAsync
   */
  public deleteByKeyInTxIterable(keys: Iterable<K>): void {
    this.deleteInTxInternal(null, keys);
  }

  /**
   * Deletes all entities with the given keys in the database using a transaction.
   *
   * @param keys Keys of the entities to delete.
   */
  public async deleteByKeyInTxIterableAsync(keys: Iterable<K>): Promise<void> {
    await this.deleteInTxInternalAsync(null, keys);
  }

  public deleteByKeyInTxIterableSync(keys: Iterable<K>): void {
     this.deleteInTxInternalSync(null, keys);
  }

  /**
   * Deletes all entities with the given keys in the database using a transaction.
   *
   * @param keys Keys of the entities to delete.
   * @deprecated since 2.1.1
   * @useinstead AbstractDao#deleteByKeyInTxArrAsync
   */
  public deleteByKeyInTxArr(...keys: K[]): void {
    this.deleteInTxInternal(null, keys);
  }

  /**
   * Deletes all entities with the given keys in the database using a transaction.
   *
   * @param keys Keys of the entities to delete.
   */
  public async deleteByKeyInTxArrAsync(...keys: K[]): Promise<void> {
    await this.deleteInTxInternalAsync(null, keys);
  }

  public deleteByKeyInTxArrSync(...keys: K[]): void {
    this.deleteInTxInternalSync(null, keys);
  }

  /** Resets all locally changed properties of the entity by reloading the values from the database. */
  public async refresh(entity: T): Promise<void> {
    this.assertSinglePk();
    let key: K = this.getKeyVerified(entity);
    let sql = this.statements.getSelectByKey();
    sql.equalTo(this.getPkColumns()[0], key.toString())

    let cursor: relationalStore.ResultSet = await this.db.rawQuery(sql, this.getAllColumns());
    try {
      if (cursor) {
        let available: boolean = cursor.goToFirstRow();
        if (!available) {
          throw new DaoException("Entity does not exist in the database anymore: " + entity
            + " with key " + key);
        } else if (cursor.rowCount === 0) {
          throw new DaoException("Expected unique result, but count was " + cursor.rowCount);
        }
        this.readEntity2(cursor, entity, 0);
        this.attachEntityM(key, entity, true);
      }
    } finally {
      if (cursor) {
        cursor.close();
      }
    }
  }

  public refreshSync(entity: T): void {
    this.assertSinglePk();
    let key: K = this.getKeyVerified(entity);
    let sql = this.statements.getSelectByKey();
    sql.equalTo(this.getPkColumns()[0], key.toString())

    let cursor: relationalStore.ResultSet =  this.db.rawQuerySync(sql, this.getAllColumns());
    try {
      if (cursor) {
        let available: boolean = cursor.goToFirstRow();
        if (!available) {
          throw new DaoException("Entity does not exist in the database anymore: " + entity
            + " with key " + key);
        } else if (cursor.rowCount === 0) {
          throw new DaoException("Expected unique result, but count was " + cursor.rowCount);
        }
        this.readEntity2(cursor, entity, 0);
        this.attachEntityM(key, entity, true);
      }
    } finally {
      if (cursor) {
        cursor.close();
      }
    }
  }
  /**
   * @deprecated since 2.1.1
   * @useinstead AbstractDao#updateAsync
   */
  public async update(entity: T, conflictResolution?: relationalStore.ConflictResolution): Promise<void> {
    DaoTraceUtil.startInfo("AbstractDao.update", DaoTraceSpace.TraceType.CRUD);
    let stmt: DatabaseStatement = this.statements.getUpdateStatement();
    let transaction = await this.db.beginTransactionAsync();
    try {
      this.updateInsideSynchronized(transaction, entity, stmt, true, conflictResolution);
      await this.db.endTransactionAsync(transaction);
    } catch (e) {
      DaoTraceUtil.startError("AbstractDao.update.error", DaoTraceSpace.TraceType.CRUD);
      DaoLog.e(e.message, e.stack)
      await this.db.rollBackAsync(transaction)
      DaoTraceUtil.finish("AbstractDao.update.error");
    }
    DaoTraceUtil.finish("AbstractDao.update");
  }

  public updateSync(entity: T, conflictResolution?: relationalStore.ConflictResolution): void {
    let stmt: DatabaseStatement = this.statements.getUpdateStatement();
    try {
      this.updateInsideSync(null, entity, stmt, true, conflictResolution);
    } catch (e) {
      DaoLog.e(e.message, e.stack)
    }
  }

  public async updateAsync(entity: T, conflictResolution?: relationalStore.ConflictResolution): Promise<void> {
    let stmt: DatabaseStatement = this.statements.getUpdateStatement();
    try {
      await this.updateInsideAsync(null, entity, stmt, true, conflictResolution);
    } catch (e) {
      DaoTraceUtil.startError("AbstractDao.updateAsync.error", DaoTraceSpace.TraceType.CRUD);
      DaoLog.e(e.message, e.stack)
      DaoTraceUtil.finish("AbstractDao.updateAsync.error");
    }
  }

  public queryBuilder(): QueryBuilder<T> {
    return QueryBuilder.internalCreate(this);
  }

  /**
   * @deprecated since 2.1.1
   * @useinstead AbstractDao#updateInsideAsync
   */
  protected updateInsideSynchronized(transaction: Transaction | null, entity: T,
    stmt: SQLiteStatement | DatabaseStatement, lock: boolean,
    conflictResolution?: relationalStore.ConflictResolution): void {
    // To do? Check if it's worth not to bind PKs here (performance).
    stmt.clearBindings();
    this.bindValues(stmt, entity);
    let key: K = this.getKey(entity);
    if (key === null || key === undefined) {
      throw new DaoException("Cannot update entity without key - was it inserted before?");
    }
    let predicates = new relationalStore.RdbPredicates(this.getTableName())
    if (stmt instanceof SQLiteStatement) {
      stmt.sql = predicates;
      stmt.sql.equalTo(this.getPkColumns()[0], key.toString());
    } else {
      stmt.getRawStatement().sql = predicates;
      stmt.getRawStatement().sql.equalTo(this.getPkColumns()[0], key.toString());
    }
    // 异步代码
    stmt.executeUpdate(transaction, conflictResolution);
    this.attachEntityM(key, entity, lock);
  }

  protected async updateInsideAsync(transaction: Transaction | null, entity: T,
    stmt: SQLiteStatement | DatabaseStatement, lock: boolean,
    conflictResolution?: relationalStore.ConflictResolution): Promise<void> {
    // To do? Check if it's worth not to bind PKs here (performance).
    stmt.clearBindings();
    this.bindValues(stmt, entity);
    let key: K = this.getKey(entity);
    if (key === null || key === undefined) {
      throw new DaoException("Cannot update entity without key - was it inserted before?");
    }
    let predicates = new relationalStore.RdbPredicates(this.getTableName())
    if (stmt instanceof SQLiteStatement) {
      stmt.sql = predicates;
      stmt.sql.equalTo(this.getPkColumns()[0], key.toString());
    } else {
      stmt.getRawStatement().sql = predicates;
      stmt.getRawStatement().sql.equalTo(this.getPkColumns()[0], key.toString());
    }
    // 异步代码
    await stmt.executeUpdate(transaction, conflictResolution);
    this.attachEntityM(key, entity, lock);
  }

  protected updateInsideSync(transaction: Transaction | null, entity: T,
    stmt: SQLiteStatement | DatabaseStatement, lock: boolean,
    conflictResolution?: relationalStore.ConflictResolution): void {
    stmt.clearBindings();
    this.bindValues(stmt, entity);
    let key: K = this.getKey(entity);
    if (key === null || key === undefined) {
      throw new DaoException("Cannot update entity without key - was it inserted before?");
    }
    let predicates = new relationalStore.RdbPredicates(this.getTableName())
    if (stmt instanceof SQLiteStatement) {
      stmt.sql = predicates;
      stmt.sql.equalTo(this.getPkColumns()[0], key.toString());
    } else {
      stmt.getRawStatement().sql = predicates;
      stmt.getRawStatement().sql.equalTo(this.getPkColumns()[0], key.toString());
    }
    stmt.executeUpdateSync(transaction, conflictResolution);
    this.attachEntityM(key, entity, lock);
  }


  /**
   * Attaches the entity to the identity scope. Calls attachEntity(T entity).
   *
   * @param key    Needed only for identity scope, pass null if there's none.
   * @param entity The entity to attach
   */
  protected attachEntityM(key: K, entity: T, lock: boolean): void {
    this.attachEntity(entity);
    if (this.identityScope && key !== null && key !== undefined) {
      this.identityScope.put(key, entity);
    }
  }

  /**
   * Sub classes with relations additionally set the DaoMaster here. Must be called before the entity is attached to
   * the identity scope.
   *
   * @param entity The entity to attach
   */
  protected attachEntity(entity: T): void {
  }

  /**
   * Updates the given entities in the database using a transaction.
   *
   * @param entities The entities to insert.
   * @deprecated since 2.1.1
   * @useinstead AbstractDao#updateInTxIterableAsync
   */
  public async updateInTxIterable(transaction: Transaction | null,
    entities: Iterable<T>): Promise<void> {
    let stmt: DatabaseStatement = this.statements.getUpdateStatement();
    // txEx: just to preserve original exception in case another exceptions is thrown in endTransaction()
    let txEx: Error = null;
    try {
      for (let entity of entities) {
        this.updateInsideSynchronized(transaction, entity, this.isStandardSQLite ? stmt.getRawStatement() : stmt,
          false);
      }
      await this.db.endTransactionAsync(transaction);
    } catch (e) {
      DaoTraceUtil.startError("AbstractDao.updateInTxIterable.error", DaoTraceSpace.TraceType.CRUD);
      DaoLog.e(e.message, e.stack)
      await this.db.rollBackAsync(transaction);
      txEx = e;
      DaoTraceUtil.finish("AbstractDao.updateInTxIterable.error");
    }
    if (txEx) {
      throw txEx;
    }
  }

  /**
   * Updates the given entities in the database using a transaction.
   *
   * @param entities The entities to insert.
   */
  public async updateInTxIterableAsync(entities: Iterable<T>): Promise<void> {
    let stmt: DatabaseStatement = this.statements.getUpdateStatement();
    let transaction = await this.db.beginTransactionAsync();
    // txEx: just to preserve original exception in case another exceptions is thrown in endTransaction()
    let txEx: Error = null;
    try {
      for (let entity of entities) {
        await this.updateInsideAsync(transaction, entity, this.isStandardSQLite ? stmt.getRawStatement() : stmt, false);
      }
      await this.db.endTransactionAsync(transaction);
    } catch (e) {
      DaoTraceUtil.startError("AbstractDao.updateInTxIterableAsync.error", DaoTraceSpace.TraceType.CRUD);
      DaoLog.e(e.message, e.stack)
      await this.db.rollBackAsync(transaction)
      txEx = e;
      DaoTraceUtil.finish("AbstractDao.updateInTxIterableAsync.error");
    }
    if (txEx) {
      throw txEx;
    }
  }

  public updateInTxIterableSync(entities: Iterable<T>): void {
    let stmt: DatabaseStatement = this.statements.getUpdateStatement();
    try {
      for (let entity of entities) {
        this.updateInsideSync(null, entity, this.isStandardSQLite ? stmt.getRawStatement() : stmt, false);
      }
    } catch (e) {
      DaoTraceUtil.startError("AbstractDao.updateInTxIterableSync.error", DaoTraceSpace.TraceType.CRUD);
      DaoLog.e(e.message, e.stack)
      DaoTraceUtil.finish("AbstractDao.updateInTxIterableSync.error");
    }
  }

  /**
   * Updates the given entities in the database using a transaction.
   *
   * @param entities The entities to update.
   * @deprecated since 2.1.1
   * @useinstead AbstractDao#updateInTxAsync
   */
  public updateInTx(transaction: Transaction | null, ...entities: any[]): void {
    this.updateInTxIterable(transaction, entities);
  }

  /**
   * Updates the given entities in the database using a transaction.
   *
   * @param entities The entities to update.
   */
  public async updateInTxAsync(...entities: any[]): Promise<void> {
    entities = entities.flat(Infinity);
    await this.updateInTxIterableAsync(entities);
  }

  public updateInTxSync(...entities: any[]): void {
    entities = entities.flat(Infinity);
    this.updateInTxIterableSync(entities);
  }

  protected assertSinglePk(): void {
    if (this.config.pkColumns.length !== 1) {
      throw new DaoException(this + " (" + this.config.tablename + ") does not have a single-column primary key");
    }
  }


  /** See {@link #getKey(Object)}, but guarantees that the returned key is never null (throws if null). */
  protected getKeyVerified(entity: T): K {
    let key: K = this.getKey(entity);
    if (key === null || key === undefined) {
      if (!entity) {
        throw new Error("Entity may not be null");
      } else {
        throw new DaoException("Entity has no key");
      }
    } else {
      return key;
    }
  }

  /** Gets the SQLiteDatabase for custom database access. Not needed for dataORM entities. */
  public getDatabase(): Database {
    return this.db;
  }

  /** Reads the values from the current position of the given cursor and returns a new entity. */
  protected abstract readEntity(cursor: any, offset: number, isDeep?: boolean): T;


  /** Reads the key from the current position of the given cursor, or returns null if there's no single-value key. */
  protected abstract readKey(cursor: any, offset: number): K;

  /** Reads the values from the current position of the given cursor into an existing entity. */
  protected abstract readEntity2(cursor: any, entity: T, offset: number): void;

  /**
   * Binds the entity's values to the statement. Make sure to synchronize the enclosing DatabaseStatement outside
   * of the method.
   */
  protected abstract bindValues(stmt: SQLiteStatement | DatabaseStatement, entity: T): void;

  /**
   * Binds the entities values to the statement. Make sure to synchronize the enclosing DatabaseStatement outside
   * of the method.
   */
  protected abstract bindValuesArray(stmt: SQLiteStatement | DatabaseStatement, entity: T[]): void;

  /**
   * Updates the entity's key if possible (only for Long PKs currently). This method must always return the entity's
   * key regardless of whether the key existed before or not.
   */
  protected abstract updateKeyAfterInsert(entity: T, rowId: number): K;

  /**
   * Returns the value of the primary key, if the entity has a single primary key, or, if not, null. Returns null if
   * entity is null.
   */
  protected abstract getKey(entity: T): K;

  /**
   * Returns true if the entity is not null, and has a non-null key, which is also != 0.
   * entity is null.
   */
  protected abstract hasKey(entity: T): boolean;

  /** Returns true if the Entity class can be updated, e.g. for setting the PK after insert. */
  protected abstract isEntityUpdateAble(): boolean;

  public query(select: Select<any>): Promise<Array<T>> {
    let st = this.getDatabase();
    let key = this.getPkColumns()[0];
    let maps = select.getKeyMaps();
    let isHasKey = false;
    let valueId: number = -1;
    maps.forEach((v, k) => {
      if (k.toString() === key) {
        isHasKey = true;
        valueId = v
      }
    });
    if (isHasKey) {
      let array = new Array<any>();
      return this.load(<any> valueId).then(async (entry) => {
        if (entry) {
          array.push(entry);
        }
        if (st?.getTableChangedListener()) {
          st.getTableChangedListener().onTableChanged(array, TableAction.QUERY)
        }
        return array;
      });
    } else {
      return this.buildSelect(select);
    }
  }

  public querySync(select: Select<any>): Array<T>{
    let st = this.getDatabase();
    let key = this.getPkColumns()[0];
    let maps = select.getKeyMaps();
    let isHasKey = false;
    let valueId: number = -1;
    maps.forEach((v, k) => {
      if (k.toString() === key) {
        isHasKey = true;
        valueId = v
      }
    });
    if (isHasKey) {
      let array = new Array<any>();
      let entry = this.loadSync(<any> valueId)
      if (entry) {
        array.push(entry);
      }
      if (st?.getTableChangedListener()) {
        st.getTableChangedListener().onTableChanged(array, TableAction.QUERY)
      }
      return array;
    } else {
      return this.buildSelectSync(select);
    }
  }

  public buildSelect(select: Select<any>): Promise<Array<T>> {
    let rdbStore = this.getDatabase().getRawDatabase()
    let that = this;
    let st = this.getDatabase();
    return rdbStore.query(select.build(), this.getAllColumns()).then(async (data) => {
      // 查询结果加入缓存
      let arraysT = that.loadAllFromCursor(data);
      if (st?.getTableChangedListener()) {
        st.getTableChangedListener().onTableChanged(arraysT, TableAction.QUERY)
      }
      return arraysT;
    })

  }

  public buildSelectSync(select: Select<any>): Array<T>{
    let rdbStore = this.getDatabase().getRawDatabase()
    let that = this;
    let st = this.getDatabase();
    let resultSet = rdbStore.querySync(select.build(), this.getAllColumns());
    let arraysT = that.loadAllFromCursor(resultSet);
    if (st?.getTableChangedListener()) {
      st.getTableChangedListener().onTableChanged(arraysT, TableAction.QUERY)
    }
    return arraysT;
  }

  public async rawQuery(sql: string, selectionArgs?: Array<any>): Promise<any> {
    return await this.db.rawQueries(sql, selectionArgs)
  }

  private myOnTableChangedListener = null;

  /**
   * 添加监听
   * @param listener
   */
  public addTableChangedListener(listener: OnTableChangedListener<any>) {
    this.myOnTableChangedListener = listener;
    this.getDatabase().addTableChangedListener(listener)

  }

  /**
   *  取消监听
   */
  public removeTableChangedListener() {
    this.getDatabase().removeTableChangedListener();
    this.myOnTableChangedListener = null;
  }

  getTableChangedListener(): OnTableChangedListener<any> {
    return this.myOnTableChangedListener
  }

  public static generatorProperties<T>(t: T, useCache: boolean): Property[] {
    return this.generatorPropertyArr(t, useCache);
  }

  private static getType(types): string {
    let typestr;
    switch (types) {
      case 'string':
      case 'String':
        typestr = 'TEXT';
        break;
      case 'number':
      case 'Number':
        typestr = 'INTEGER';
        break;
      case 'real':
      case 'Real':
        typestr = 'REAL';
        break;
      case 'blob':
      case 'Blob':
        typestr = 'BLOB';
        break;
      default:
        typestr = 'TEXT';
    }
    return typestr
  }

  private static entity: Entity
  private static toOneRelations: Array<ToOneEntity> = [] // 存取一对一关系
  private static toManyRelations: Array<ToManyEntity> = [] // 存取一对多关系
  private static toManyWithJoinEntity: Array<any> = [] // 临时存放joinEntity的注解值

  /**
   * 循环开始之前
   *
   * @param entityCls
   */
  private static onStart(entityCls: any) {
    this.entity = new Entity()
    this.toOneRelations = []
    this.toManyRelations = []
    this.toManyWithJoinEntity = []

    this.entity.className = DbUtils.getEntityClassName(entityCls);
    this.entity.dbName = AbstractDao.TABLENAME(entityCls)
  }

  /**
   * 循环中
   *
   * @param index
   * @param item
   * @param entityCls
   */
  private static onResume(item: string, entityCls: any) {
    let toOneItem = this.getToOneItem(item, entityCls)
    let toManyItem = this.getToManyItem(item, entityCls)
    let joinEntityTempItem = this.getJoinEntityTempListItem(item, entityCls)

    if (toOneItem) {
      this.toOneRelations.push(toOneItem)
    }
    if (toManyItem) {
      this.toManyRelations.push(toManyItem)
    }
    if (joinEntityTempItem) {
      this.toManyWithJoinEntity.push(joinEntityTempItem)
    }
  }

  /**
   * 循环结束
   */
  private static onEnd() {
    this.entity.toOneRelations = this.toOneRelations
    this.entity.toManyRelations = this.toManyRelations
    this.entity.joinEntityTempList = this.toManyWithJoinEntity
    GlobalContext.getContext().getValue(GlobalContext.KEY_CLS_RE_SHIP_ARRAY)[this.entity.className] = this.entity
  }

  /**
   * 所有的表都已初始化完毕
   */
  public static allTableIsCreateEnd() {
    let entityArr = GlobalContext.getContext().getValue(GlobalContext.KEY_CLS_RE_SHIP_ARRAY);
    for (let entityClsRelationshipArrKey in entityArr) {

      // 处理ToOne
      let toOneRelations = GlobalContext.getContext()
        .getValue(GlobalContext.KEY_CLS_RE_SHIP_ARRAY)[entityClsRelationshipArrKey]['toOneRelations']
      if (toOneRelations && toOneRelations.length > 0) {
        toOneRelations.forEach(item => {
          let tempList = item.tempList || []
          let tempItem = tempList[0]
          if (tempItem) {
            let fkp = this.getFkProperties(entityClsRelationshipArrKey, tempItem)
            item.fkProperties = [fkp]
          }
        })
      }

      // 处理ToMany
      let toManyRelations = GlobalContext.getContext()
        .getValue(GlobalContext.KEY_CLS_RE_SHIP_ARRAY)[entityClsRelationshipArrKey]['toManyRelations']
      if (toManyRelations && toManyRelations.length > 0) {
        toManyRelations.forEach(item => {
          let tempList: Array<string> = item.tempList || []
          let sourceProperties: Property[] = []
          let targetProperties: Property[] = []
          tempList.forEach(tempListItem => {
            let where = tempListItem.split(',')[0]
            let colName = tempListItem.split(',')[1]
            let clsName = tempListItem.split(',')[2]

            switch (where) {
              case 'source':
                sourceProperties.push(this.getFkProperties(clsName, colName))
                break
              case 'target':
                targetProperties.push(this.getFkProperties(clsName, colName))
                break
            }
          })
          item.sourceProperties = sourceProperties
          item.targetProperties = targetProperties
          let targetClsName = item.targetEntityClsName
          let incomingToManyRelations =
            GlobalContext.getContext().getValue(GlobalContext.KEY_CLS_RE_SHIP_ARRAY)[targetClsName]
              .incomingToManyRelations
          if (incomingToManyRelations && incomingToManyRelations.length > 0) {
            GlobalContext.getContext().getValue(GlobalContext.KEY_CLS_RE_SHIP_ARRAY)[targetClsName]
              .incomingToManyRelations = incomingToManyRelations.concat([item])
          } else {
            GlobalContext.getContext().getValue(GlobalContext.KEY_CLS_RE_SHIP_ARRAY)[targetClsName]
              .incomingToManyRelations = [item]
          }
        })
      }

      // 处理 joinEntity
      let joinEntityTempList = GlobalContext.getContext()
        .getValue(GlobalContext.KEY_CLS_RE_SHIP_ARRAY)[entityClsRelationshipArrKey]['joinEntityTempList']
      if (joinEntityTempList && joinEntityTempList.length > 0) {
        var joinEntity = []
        joinEntityTempList.forEach(item => {
          let toManyWithJoinEntity: ToManyWithJoinEntity = new ToManyWithJoinEntity()
          // 取注解的值
          let entityName = item.entityName
          let sourcePropertyName = item.sourceProperty
          let targetPropertyName = item.targetProperty
          let itemName = item.item
          let clsName = item.clsName
          let targetClsName = item.targetClsName

          // 封装joinEntity的值
          let clsProperty = GlobalContext.getContext().getValue(GlobalContext.KEY_CLS_RE_SHIP_ARRAY)[entityName]
          let entity = new Entity()
          entity.className = clsProperty.className
          entity.dbName = clsProperty.dbName
          entity.pkProperty = clsProperty.pkProperty

          // 封装父类的值
          toManyWithJoinEntity.joinEntity = entity
          toManyWithJoinEntity.name = itemName
          toManyWithJoinEntity.sourceEntityClsName = clsName
          toManyWithJoinEntity.targetEntityClsName = entityName
          toManyWithJoinEntity.sourceProperties = [this.getFkProperties(entityName, sourcePropertyName)]
          toManyWithJoinEntity.targetProperties = [this.getFkProperties(entityName, targetPropertyName)]

          joinEntity.push(toManyWithJoinEntity)

          // 给目标cls赋值incomingToManyRelations
          let incomingToManyRelations =
            GlobalContext.getContext().getValue(GlobalContext.KEY_CLS_RE_SHIP_ARRAY)[targetClsName]
              .incomingToManyRelations
          if (incomingToManyRelations && incomingToManyRelations.length > 0) {
            GlobalContext.getContext().getValue(GlobalContext.KEY_CLS_RE_SHIP_ARRAY)[targetClsName]
              .incomingToManyRelations = incomingToManyRelations.concat([toManyWithJoinEntity])
          } else {
            GlobalContext.getContext().getValue(GlobalContext.KEY_CLS_RE_SHIP_ARRAY)[targetClsName]
              .incomingToManyRelations = [toManyWithJoinEntity]
          }

        })

        // 将原本的toMany的数组与joinEntity的数组进行合并
        let toManyRelations =
          GlobalContext.getContext().getValue(GlobalContext.KEY_CLS_RE_SHIP_ARRAY)[entityClsRelationshipArrKey]
            .toManyRelations
        if (toManyRelations && toManyRelations.length > 0) {
          GlobalContext.getContext().getValue(GlobalContext.KEY_CLS_RE_SHIP_ARRAY)[entityClsRelationshipArrKey]
            .toManyRelations = toManyRelations.concat(joinEntity)
        } else {
          GlobalContext.getContext().getValue(GlobalContext.KEY_CLS_RE_SHIP_ARRAY)[entityClsRelationshipArrKey]
            .toManyRelations = joinEntity
        }

      }
      let entity = GlobalContext.getContext().getValue(GlobalContext.KEY_CLS_RE_SHIP_ARRAY)[entityClsRelationshipArrKey]
      GlobalContext.getContext().getValue(GlobalContext.KEY_CLS_RE_SHIP)[entityClsRelationshipArrKey] = entity;
    }

    let res = GlobalContext.getContext().getValue(GlobalContext.KEY_CLS_RE_SHIP_ARRAY)
  }

  /**
   * 根据传入的类名和变量名寻找属性对象
   *
   * @param className
   * @param itemName
   */
  private static getFkProperties(className, itemName): Property {
    let obj = GlobalContext.getContext().getValue(GlobalContext.KEY_CLS)[className]
    if (obj) {
      for (let objKey in obj) {
        if (obj[objKey].columnName === itemName) {
          return obj[objKey]
        }
      }
    }
    return null
  }

  /**
   * 获取toOne的item
   *
   * @param item
   * @param entityCls
   */
  private static getToOneItem(item: string, entityCls: any): ToOneEntity {
    let { toOne } = getClsColumns(entityCls, item);
    if (toOne) {
      let toOneEntity = new ToOneEntity()
      toOneEntity.name = item
      toOneEntity.sourceEntityClsName = DbUtils.getEntityClassName(entityCls)
      toOneEntity.targetEntityClsName = DbUtils.getEntityClassName(toOne.targetObj)
      toOneEntity.tempList[0] = toOne.joinProperty
      return toOneEntity
    }
    return null
  }


  /**
   * 获取joinEntity的注解值
   *
   * @param className
   * @param itemName
   */
  private static getJoinEntityTempListItem(item: string, entityCls: any): any {
    let { joinEntity } = getClsColumns(entityCls, item);
    if (joinEntity) {
      let res = {
        entityName: joinEntity.entityName,
        sourceProperty: joinEntity.sourceProperty,
        targetProperty: joinEntity.targetProperty,
        item: item,
        clsName: entityCls.name,
        targetClsName: joinEntity.targetClsName
      }
      return res
    }
    return null
  }

  /**
   * 获取toMany的item
   *
   * @param item
   * @param entityCls
   */
  private static getToManyItem(item: string, entityCls: any): ToManyEntity {
    let { toMany, orderBy } = getClsColumns(entityCls, item);

    if (toMany) {
      let targetClsName = toMany.targetClsName;
      let joinProperty = toMany.joinProperty;
      let toManyEntity: ToManyEntity = new ToManyEntity()
      toManyEntity.name = item
      toManyEntity.sourceEntityClsName = entityCls.name
      toManyEntity.targetEntityClsName = targetClsName
      toManyEntity.orderBy = orderBy || ''

      toManyEntity.tempList = []
      joinProperty.forEach(item => { // 临时存储待查询的表名和属性名
        toManyEntity.tempList.push('source,' + item.name + ',' + this.entity.className,
          'target,' + item.referencedName + ',' + targetClsName)
      })

      return toManyEntity
    }
    return null
  }

  public static assembleProperty(index: number, entityCls: Function, item: string,
    prefix: string, sourcesPropertyArray: Queue<string>, result: Array<Object>) {
    // 处理实体中过滤的属性名
    let { transient, embedded } = getClsColumns(entityCls, item);
    if (transient) {
      return;
    }
    if (embedded) {
      if (sourcesPropertyArray && sourcesPropertyArray.size() > index) {
        while (!sourcesPropertyArray.empty()) {
          sourcesPropertyArray.removeFirst();
          if (sourcesPropertyArray.size() === index) {
            break;
          }
        }
      }
      // 执行下层
      let prefix = embedded.prefix;
      let targetClass = embedded.targetClass;
      if (!sourcesPropertyArray) {
        sourcesPropertyArray = new Queue<string>();
      }
      sourcesPropertyArray.add(item);
      index++;
      Object.keys(new targetClass()).forEach((value, i) => {
        if (sourcesPropertyArray && sourcesPropertyArray.size() > index) {
          while (!(sourcesPropertyArray.empty())) {
            sourcesPropertyArray.removeFirst();
            if (sourcesPropertyArray.size() === index) {
              break;
            }
          }
        }
        this.assembleProperty(index, targetClass, value, prefix, sourcesPropertyArray, result);
      })
    } else {
      let { columnName, isPrimaryKey, autoincrement, isUnionPrimaryKey, convert, types } =
        getClsColumns(entityCls, item);
      if (isUnionPrimaryKey) {
        isPrimaryKey = isUnionPrimaryKey;
      }
      // Converter处理
      let convertParam: ConvertParameter;
      if (convert) {
        if (!columnName) {
          columnName = item;
        }
        convertParam = new ConvertParameter(convert.converter, convert.columnType);
      }

      if (columnName) {
        if (convertParam) {
          types = convertParam.getColumnType();
        }
        let typestr = this.getType(types);
        if (prefix) {
          columnName = prefix + columnName;
        }

        let pro = new Property(index, typestr, item, isPrimaryKey, columnName, autoincrement, sourcesPropertyArray);
        pro.setConvertParamObj(convertParam);

        let { orderBy, notNull, unique, indexUnique, indexName } = getClsColumns(entityCls, item);
        if (orderBy || notNull || unique) {
          let constraint: Constraint = new Constraint();
          if (orderBy) {
            constraint.setOrderBy(orderBy);
          }
          if (notNull) {
            constraint.setNotNull(notNull);
          }
          if (unique) {
            constraint.setUnique(unique);
          }
          pro.setConstraint(constraint);
        }
        if (indexUnique !== null && indexUnique !== undefined) {
          pro.setIndex({ unique: indexUnique, name: indexName });
        }
        if (isPrimaryKey === true && !sourcesPropertyArray) {
          this.entity.pkProperty = pro // 记录主键
        }
        result[result.length] = pro;
      }
    }
  }

  public static generatorPropertyArr(entityCls: any, useCache: boolean): Property[] {
    if (entityCls?.prototype?.PropertiesArray && useCache) {
      return entityCls.prototype.PropertiesArray;
    }
    let arr: Property[] = [];
    let entity = new entityCls();
    let index: number = 0;
    let properties: Properties = {};
    this.onStart(entityCls)
    let arrays = new Array<Property>();
    let isUnionPrimaryKey = false;
    Object.keys(entity).forEach((item, idx) => {
      this.onResume(item, entityCls)
      if (!isUnionPrimaryKey) {
        isUnionPrimaryKey = getClsColumns(entityCls, item).isUnionPrimaryKey;
      }
      this.assembleProperty(0, entityCls, item, null, null, arrays);
    });
    arrays.forEach((obj, i) => {
      obj.setOrdinal(index);
      arr[index] = obj;
      obj.setUnionPrimaryKey(isUnionPrimaryKey);
      if (obj.getSourcesPropertyArray().size() > 0) {
        properties[obj.columnName] = obj;
      } else {
        properties[obj.name] = obj;
      }
      index++;
    })
    if (entityCls && entityCls.prototype) {
      entityCls.prototype.PropertiesArray = entityCls.PropertiesArray ?? arr;
      entityCls.prototype.PropertiesObject = entityCls.PropertiesObject ?? properties;
      if (!useCache) {
        entityCls.prototype.PropertiesArray = arr;
        entityCls.prototype.PropertiesObject = properties;
      }
    }
    GlobalContext.getContext().getValue(GlobalContext.KEY_CLS)[DbUtils.getEntityClassName(entityCls)] = properties;
    this.onEnd()
    return arr;
  }

  /**
   * 建表SQL生成方法
   */
  public static getCreateTableSql<T>(ifNotExists: boolean, entityCls: T, useCache: boolean): [string, Array<Property>] {
    const arr = AbstractDao.generatorProperties(entityCls, useCache);
    const tableName = AbstractDao.TABLENAME(entityCls);
    const notNullStr = ' NOT NULL';
    const fieldDefs: string[] = [];
    const unionPrimaryKeys: string[] = [];
    let hasSinglePrimaryKey = false;

    if (arr && arr.length > 0) {
      for (let i = 0; i < arr.length; i++) {
        const property = arr[i];
        let fieldDef = `${property.columnName} ${property.type}`;
        // 主键处理
        if (property.primaryKey) {
          if (property.unionPrimaryKey) {
            unionPrimaryKeys.push(property.columnName);
          } else {
            fieldDef += ' PRIMARY KEY';
            hasSinglePrimaryKey = true;
          }
          if (property.autoincrement) {
            fieldDef += ' AUTOINCREMENT';
          }
        }
        // 约束处理
        const constraints = property.constraint;
        if (constraints) {
          if (constraints.notNull) {
            fieldDef += notNullStr;
          }
          if (constraints.uniques) {
            fieldDef += ' UNIQUE';
          }
        }
        fieldDefs.push(fieldDef);
      }
    }

    // 一次性join拼接所有字段定义，避免循环内字符串累加
    let sql = `CREATE TABLE${ifNotExists ? " IF NOT EXISTS" : ""} ${tableName} (${fieldDefs.join(',')}`;
    // 主键处理
    if (unionPrimaryKeys.length > 0) {
      sql += `, PRIMARY KEY (${unionPrimaryKeys.join(',')})`;
    }
    sql += ')';

    return [sql, arr];
  }

  private static createCompositeIndexSql<T>(ifNotExists: boolean, entityCls: T, propertiesArr: Property[]): string[] {
    const constraint = ifNotExists ? "IF NOT EXISTS " : " ";
    let resultCompositeArr = [];
    let compositeIndexSql = '';
    let indexInfoArray = AbstractDao.INDEXINFO(entityCls);
    if (indexInfoArray && indexInfoArray.length > 0) {
      for (let i = 0; i < indexInfoArray.length; i++) {
        compositeIndexSql = 'CREATE ';
        let composite_index_unique = AbstractDao.INDEXINFO(entityCls)[i].unique;
        if (composite_index_unique) {
          compositeIndexSql += 'UNIQUE ';
        }
        compositeIndexSql += 'INDEX ' + constraint;
        var indexNameArr: Array<{
          value: string,
          order: string
        }> = AbstractDao.INDEXINFO(entityCls)[i].value.split(",").map((part) => {
          part = part.trim();
          if (/ ASC$/.test(part)) {
            return { value: part.slice(0, part.length - 4), order: '_ASC' };
          } else if (/ DESC$/.test(part)) {
            return { value: part.slice(0, part.length - 5), order: '_DESC' };
          } else {
            return { value: part, order: '_ASC' };
          }
        });

        if (AbstractDao.INDEXINFO(entityCls)[0].name) {
          compositeIndexSql += ' ' + AbstractDao.INDEXINFO(entityCls)[i].name;
        } else {
          if (AbstractDao.INDEXINFO(entityCls)[0].value) {
            compositeIndexSql += 'IDX_' + AbstractDao.TABLENAME(entityCls) + "_";
            for (let item of indexNameArr) {
              let property = propertiesArr.find((propertyItem) => {
                return propertyItem.name === item.value
              })
              if (property) {
                compositeIndexSql += property.columnName + item.order + '_';
              } else {
                DaoTraceUtil.startError("AbstractDao.createCompositeIndexSql.error", DaoTraceSpace.TraceType.CRUD);
                DaoLog.e("Invalid SQL Statements form!");
                DaoTraceUtil.finish("AbstractDao.createCompositeIndexSql.error");
                throw new Error("Invalid Statements!");
              }
            }
            compositeIndexSql = compositeIndexSql.substring(0, compositeIndexSql.length - 1);
          } else {
            DaoTraceUtil.startError("AbstractDao.createCompositeIndexSql.error", DaoTraceSpace.TraceType.CRUD);
            DaoLog.e("Invalid SQL Statements form!");
            DaoTraceUtil.finish("AbstractDao.createCompositeIndexSql.error");
            throw new Error("Invalid SQL Statements form!");
          }
        }
        compositeIndexSql += ' ON ';
        compositeIndexSql += AbstractDao.TABLENAME(entityCls);
        compositeIndexSql += ' (';
        for (let item of indexNameArr) {
          let property = propertiesArr.find((propertyItem) => {
            return propertyItem.name === item.value
          })
          if (property) {
            compositeIndexSql += property.columnName + item.order.replace('_', ' ') + ',';
          } else {
            DaoTraceUtil.startError("AbstractDao.createCompositeIndexSql.error", DaoTraceSpace.TraceType.CRUD);
            DaoLog.e("Invalid SQL Statements form!");
            DaoTraceUtil.finish("AbstractDao.createCompositeIndexSql.error");
            throw new Error("Invalid Statements!");
          }
        }
        compositeIndexSql = compositeIndexSql.substring(0, compositeIndexSql.length - 1);
        compositeIndexSql += ');';
        resultCompositeArr[i] = compositeIndexSql;
      }
    }
    return resultCompositeArr;
  }

  private static createSingleIndexSql<T>(ifNotExists: boolean, entityCls: T, propertiesArr: Property[]): string[] {
    const constraint = ifNotExists ? "IF NOT EXISTS " : " ";
    let resultSingleArr = [];
    let createIndexSql = '';
    if (propertiesArr && propertiesArr.length > 0) {
      let i = 0;
      for (let property of propertiesArr) {
        if (property.index) {
          createIndexSql = 'CREATE ';
          let index_unique = property.index.unique;
          if (index_unique) {
            createIndexSql += 'UNIQUE ';
          }
          createIndexSql += 'INDEX ' + constraint;

          let index_name = property.index.name;
          if (index_name) {
            createIndexSql += index_name;
          } else {
            createIndexSql += 'IDX_' + AbstractDao.TABLENAME(entityCls) + '_';
            createIndexSql += property.columnName;
          }
          createIndexSql += ' ON ';
          createIndexSql += AbstractDao.TABLENAME(entityCls);
          createIndexSql += ' (' + property.columnName;

          createIndexSql += ' ASC';

          createIndexSql += ');';
          resultSingleArr[i] = createIndexSql;
          i++;
        }
      }
    }
    return resultSingleArr;
  }

  public static getCreateIndexSql<T>(ifNotExists: boolean, entityCls: T): string[] {

    //       示例 const constraint = ifNotExists ? "IF NOT EXISTS " : "";
    //       复合 delegate.execSQL("CREATE UNIQUE INDEX " + constraint + "IDX_NOTE_TEXT123_ASC_DATE_DESC ON \"NOTE\"" + " (\"TEXT123\" ASC,\"DATE\" DESC);");
    //       单个 delegate.execSQL("CREATE UNIQUE INDEX " + constraint + "IDX_NOTE_TYPE ON \"NOTE\"" +
    //        " (\"TYPE\" ASC);");

    let propertiesArr = AbstractDao.generatorProperties(entityCls, true);
    let resultArr: string[] = [];
    let compositeArr = AbstractDao.createCompositeIndexSql(ifNotExists, entityCls, propertiesArr);
    if (compositeArr && compositeArr.length > 0) {
      resultArr = compositeArr;
    }
    let singleArr = AbstractDao.createSingleIndexSql(ifNotExists, entityCls, propertiesArr);
    if (singleArr && singleArr.length > 0) {
      resultArr = resultArr.concat(singleArr);
    }
    return resultArr;
  }
}

export class Properties {
}
