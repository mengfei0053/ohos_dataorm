/*
 * Copyright (c) 2025 Huawei Device Co., Ltd.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { beforeAll, beforeEach, describe, expect, it } from '@ohos/hypium';
import {
  BaseDao,
  ColumnType,
  DaoMaster,
  DaoSession,
  GlobalContext,
  Migration,
  Property,
  inquiry as Select
} from '@ohos/dataorm';
import { Note } from '../../../main/ets/pages/Note';
import { CTXInstance } from './CTXInstance';
import { ExampleOpenHelper } from './ExampleOpenHelper';
import relationalStore from '@ohos.data.relationalStore'
import { QueryTestSync } from '../../../main/ets/pages/util';

export default function syncApiTest() {
  describe('SyncApiTest', () => {
    let daoSession: DaoSession;
    let noteDao: BaseDao<Note, number>;
    let ctt: Context = CTXInstance.getInstance().getContext();
    let testNoteId: number = -1;

    beforeAll(async () => {
      let newVersion = 2;
      let helper: ExampleOpenHelper = new ExampleOpenHelper(ctt, "sync_notes.db");
      helper.setEncrypt(true);
      helper.setEntities(Note);
      helper.setVersion(newVersion);
      let migration: Migration =
        new Migration("sync_notes.db", "NOTE", newVersion).addColumn("MONEYS", ColumnType.realValue);
      helper.setMigration(migration);
      let db = await helper.getWritableDb()
      db.name = "sync_notes.db";
      daoSession = new DaoMaster(db).newSession();
      GlobalContext.getContext().setValue("daoSession", daoSession);
      noteDao = daoSession.getBaseDao(Note);
    })

    beforeEach(async () => {
      await noteDao.deleteAllAsync();
      testNoteId = -1;
    })

    it('insertSyncTest_001', 0, () => {
      let note = new Note();
      let noteText = 'Test insertSync';
      note.setText(noteText);
      note.setCreateTime(new Date().toLocaleString());
      let rowId = noteDao.insertSync(note);
      expect(rowId).assertLarger(0);
      testNoteId = rowId;
      let queryNote = noteDao.loadSync(testNoteId);
      expect(queryNote.getText()).assertEqual(noteText);
    })

    it('insertWithoutSettingPkSyncTest_002', 0, () => {
      let note = new Note();
      let noteText = 'Test insertWithoutSettingPkSync';
      note.setText(noteText);
      note.setCreateTime(new Date().toLocaleString());
      let rowId = noteDao.insertWithoutSettingPkSync(note);
      expect(rowId).assertLarger(0);
      let queryList = noteDao.loadAllSync();
      expect(queryList.length).assertEqual(1);
      expect(queryList[0].getText()).assertEqual(noteText);
    })

    it('loadSyncTest_003', 0, () => {
      let note = new Note();
      let noteText = 'Test loadSync';
      note.setText(noteText);
      note.setCreateTime(new Date().toLocaleString());
      testNoteId = noteDao.insertSync(note);
      let loadedNote = noteDao.loadSync(testNoteId);
      expect(loadedNote.getId()).assertEqual(testNoteId);
      expect(loadedNote.getText()).assertEqual(noteText);
    })

    it('loadAllSyncTest_004', 0, () => {
      for (let i = 0; i < 3; i++) {
        let note = new Note();
        note.setText('Test loadAllSync ' + i);
        note.setCreateTime(new Date().toLocaleString());
        noteDao.insertSync(note);
      }
      let allNotes = noteDao.loadAllSync();
      expect(allNotes.length).assertEqual(3);
      for (let i = 0; i < allNotes.length; i++) {
        expect(allNotes[i].getText()).assertContain('Test loadAllSync');
      }
    })

    it('loadByRowIdSyncTest_005', 0, () => {
      let note = new Note();
      let noteText = 'Test loadByRowIdSync';
      note.setText(noteText);
      note.setCreateTime(new Date().toLocaleString());
      let rowId = noteDao.insertSync(note);
      let loadedNote = noteDao.loadByRowIdSync(rowId);
      expect(loadedNote.getText()).assertEqual(noteText);
    })

    it('deleteSyncTest_006', 0, () => {
      let note = new Note();
      let noteText = 'Test deleteSync';
      note.setText(noteText);
      note.setCreateTime(new Date().toLocaleString());
      testNoteId = noteDao.insertSync(note);
      let loadedNote = noteDao.loadSync(testNoteId);
      noteDao.deleteSync(loadedNote);
      loadedNote = noteDao.loadSync(testNoteId);
      expect(loadedNote).assertEqual(undefined);
    })

    it('updateSyncTest_007', 0, () => {
      let note = new Note();
      let originalText = 'Test updateSync original';
      note.setText(originalText);
      note.setCreateTime(new Date().toLocaleString());
      testNoteId = noteDao.insertSync(note);
      let insertedNote = noteDao.loadSync(testNoteId);
      expect(insertedNote.getText()).assertEqual(originalText);
      let updatedText = 'Test updateSync updated';
      insertedNote.setText(updatedText);
      noteDao.updateSync(insertedNote);
      let resultNote = noteDao.loadSync(testNoteId);
      let actualText = resultNote.getText();
      expect(actualText).assertEqual(updatedText);
    })

    it('countSyncTest_008', 0, () => {
      for (let i = 0; i < 5; i++) {
        let note = new Note();
        note.setText('Count test ' + i);
        note.setCreateTime(new Date().toLocaleString());
        noteDao.insertSync(note);
      }
      let count = noteDao.queryBuilder().countSync();
      expect(count).assertEqual(5);
    })

    it('insertOrReplaceSyncTest_009', 0, () => {
      let note = new Note();
      let noteText = 'Test insertOrReplaceSync';
      note.setText(noteText);
      note.setCreateTime(new Date().toLocaleString());
      testNoteId = noteDao.insertSync(note);
      let updatedNote = new Note();
      updatedNote.setId(testNoteId);
      updatedNote.setText('Updated with insertOrReplaceSync');
      updatedNote.setCreateTime(new Date().toLocaleString());
      let replaceRowId = noteDao.insertOrReplaceSync(updatedNote);
      expect(replaceRowId).assertEqual(testNoteId);
      let resultNote = noteDao.loadSync(testNoteId);
      expect(resultNote.getText()).assertEqual('Updated with insertOrReplaceSync');
    })

    it('insertInTxArrSyncTest_010', 0, () => {
      const note1 = new Note();
      note1.setText('批量插入笔记 - ArrSync-1');
      note1.setComment('使用insertInTxArrSync接口插入');
      const note2 = new Note();
      note2.setText('批量插入笔记 - ArrSync-2');
      note2.setComment('insertInTxArrSync');
      noteDao.insertInTxArrSync(note1, note2);
      let allNotes = noteDao.loadAllSync();
      expect(allNotes.length).assertEqual(2);
    })

    it('insertInTxSyncTest_011', 0, () => {
      let notes: Note[] = [];
      for (let i = 0; i < 5; i++) {
        let note = new Note();
        note.setText('Insert in transaction ' + i);
        note.setCreateTime(new Date().toLocaleString());
        notes.push(note);
      }
      noteDao.insertInTxIterableSync(notes);
      let allNotes = noteDao.loadAllSync();
      expect(allNotes.length).assertEqual(5);
    })

    it('updateInTxSyncTest_012', 0, () => {
      let noteIds: number[] = [];
      for (let i = 0; i < 3; i++) {
        let note = new Note();
        note.setText('Original text for update ' + i);
        note.setCreateTime(new Date().toLocaleString());
        let noteId = noteDao.insertSync(note);
        noteIds.push(noteId);
      }
      let notesToUpdate: Note[] = [];
      for (let i = 0; i < noteIds.length; i++) {
        let note = noteDao.loadSync(noteIds[i]);
        note.setText('Updated in transaction ' + i);
        notesToUpdate.push(note);
      }
      noteDao.updateInTxSync(notesToUpdate);
      for (let i = 0; i < noteIds.length; i++) {
        let updatedNote = noteDao.loadSync(noteIds[i]);
        expect(updatedNote.getText()).assertEqual('Updated in transaction ' + i);
      }
    })

    it('saveInTxSyncTest_013', 0, () => {
      let existingNote = new Note();
      existingNote.setText('Existing note for save test');
      existingNote.setCreateTime(new Date().toLocaleString());
      let existingNoteId = noteDao.insertSync(existingNote);
      let notes: Note[] = [];
      existingNote = noteDao.loadSync(existingNoteId);
      existingNote.setText('Updated by saveInTxSync');
      notes.push(existingNote);
      for (let i = 0; i < 2; i++) {
        let newNote = new Note();
        newNote.setText('New note for saveInTxSync ' + i);
        newNote.setCreateTime(new Date().toLocaleString());
        notes.push(newNote);
      }
      noteDao.saveInTxSync(notes);
      let allNotes = noteDao.loadAllSync();
      expect(allNotes.length).assertEqual(3);
      existingNote = noteDao.loadSync(existingNoteId);
      expect(existingNote.getText()).assertEqual('Updated by saveInTxSync');
    })

    it('query_refreshSyncTest_014', 0, () => {
      let date = new Date()
      let comment = "Added on " + date.toLocaleString()
      let note = new Note()
      note.setText('abc')
      note.setComment(comment)
      note.setDate(new Date().toString())
      noteDao.insertSync(note)
      let entityClass = GlobalContext.getContext().getValue(GlobalContext.KEY_CLS) as Record<string, Object>;
      let properties = entityClass.Note as Record<string, Property>;
      let query = noteDao.queryBuilder().where(properties['text'].eq("abc")).buildCursor();
      let cursor: relationalStore.ResultSet = query.querySync();
      let noteArray = new Array<Note>();
      while (cursor.goToNextRow()) {
        let id = cursor.getLong(cursor.getColumnIndex("ID"))
        let text = cursor.getString(cursor.getColumnIndex("TEXT"))
        let note = new Note();
        note.setId(id);
        note.setText(text);
        noteArray.push(note)
      }
      let noteData: Note = new Note();
      if (noteArray.length > 0) {
        noteData = noteArray[0]
        noteData.setText("rrr")
        noteDao.refreshSync(noteData)
      }
      cursor.close()
      expect('abc').assertEqual(noteData.getText())
    })

    it('dbFlowQuery_015', 0, () => {
      let date = new Date()
      let comment = "Added on " + date.toLocaleString()
      let note = new Note()
      note.setText('abc')
      note.setComment(comment)
      note.setDate(date.toString())
      noteDao.insertSync(note)
      let arr: Array<Note> = QueryTestSync("TEXT", "abc")
      expect(arr.length).assertEqual(1)
    })
  })
}