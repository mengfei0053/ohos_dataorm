/*
  * Copyright (c) 2022 Huawei Device Co., Ltd.
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

import UIAbility from '@ohos.app.ability.UIAbility';
import hilog from '@ohos.hilog';
import window from '@ohos.window';
import { Migration } from '@ohos/dataorm';
import { DaoMaster } from '@ohos/dataorm';
import { Database } from '@ohos/dataorm';
import { ExampleOpenHelper } from '../pages/ExampleOpenHelper';
import { Student } from '../pages/Student';
import { Teacher } from '../pages/Teacher';
import { Classes } from '../pages/Classes';
import { Note } from '../pages/Note';
import { JoinManyToDateEntity } from '../pages/JoinManyToDateEntity';
import { DateEntity } from '../pages/DateEntity';
import { Book } from '../pages/entry/Book';
import { Chapter } from '../pages/entry/Chapter';
import { Topics } from '../pages/entry/Topics';
import { GlobalContext, DaoTraceUtil, DaoTraceSpace } from '@ohos/dataorm'
import { User } from '../pages/embed/User';
import { ConvertInfo } from '../pages/convert/ConvertInfo';
import { TypeConvert } from '../pages/convert/TypeConvert';
import { CreateInDBInfo } from '../pages/embed/CreateInDBInfo';
import { Customer } from '../pages/entry/joinProperty/Customer';
import { JoinPropertyUser } from '../pages/entry/joinProperty/JoinPropertyUser';
import { Phone } from '../pages/entry/Phone';
import { OnePlus } from '../pages/entry/OnePlus';
import { People } from '../pages/entry/People';
import { ParentObs } from '../pages/entry/Observed/ParentObs';
import { ParentObsSec } from '../pages/entry/Observed/ParentObsSec';
import { SingleObserved } from '../pages/entry/Observed/SingleObserved';
import { Province } from '../pages/entry/Observed/Province';
import { City } from '../pages/entry/Observed/City';
import { ToOneBook } from '../pages/entry/Observed/ToOneBook';
import { ToOneChapter } from '../pages/entry/Observed/ToOneChapter';
import { relationalStore } from '@kit.ArkData';
import { DaoLog } from '@ohos/dataorm/src/main/ets/core/DaoLog';
import { AbilityConstant, Want } from '@kit.AbilityKit';

export default class EntryAbility extends UIAbility {
  async onCreate(want:Want, launchParam: AbilityConstant.LaunchParam) {
    hilog.info(0x0000, 'testTag', '%{public}s', 'Ability onCreate');
    let newVersion = 1;
    console.info('EntryAbility onCreate newVersion =' + newVersion);
    // regular SQLite database
    let helper: ExampleOpenHelper = new ExampleOpenHelper(this.context, "notes.db");
    // 设定数据加密密钥，加密后不可变更，加密和非加密库暂不能切换（普通数据库不能在设定为加密库，加密库不能变更为普通库，一经生成不可变更）
    helper.setEncrypt(false);
    helper.setLogger(true)
    helper.setTrace({
      enabled:false,
      minLevel:DaoTraceSpace.TraceLevel.INFO,
      types:new Set([DaoTraceSpace.TraceType.CRUD])
    })
    // 设置数据库安全等级，不设置则默认为S1
    helper.setSecurityLevel(relationalStore.SecurityLevel.S1);
    // 设置新的数据库版本,如果新版本中包含表更新实例将在这调用onUpgradeDatabase进行表更新
    await helper.setVersion(newVersion)
    await helper.setAutoMigrate(true)
    // 将所有的表(新增,修改,已存在)加到全局
    helper.setEntities(Note, Student, Teacher, Classes, JoinManyToDateEntity, DateEntity, Book,
      Chapter, Topics, User, ConvertInfo, CreateInDBInfo, JoinPropertyUser, Customer, Phone, OnePlus, People, ParentObs,
      ParentObsSec, SingleObserved , Province, City, ToOneBook, ToOneChapter);

    // Migration为表更新实例,也可调用Migration.backupDB对当前数据库进行备份
    let migration = new Migration("notes.db", "NOTE", newVersion).addColumn("MONEYS", "REAL");
    // 将所有表更新实例放到ExampleOpenHelper的父级中
    helper.setMigration(migration);
    let db: Database = await helper.getWritableDb();
    db.name = "notes.db";
    GlobalContext.getContext().setValue("daoSession", new DaoMaster(db).newSession());
  }

  onDestroy() {
    hilog.info(0x0000, 'testTag', '%{public}s', 'Ability onDestroy');
  }

  onWindowStageCreate(windowStage: window.WindowStage) {
    // Main window is created, set main page for this ability
    hilog.info(0x0000, 'testTag', '%{public}s', 'Ability onWindowStageCreate');

    windowStage.loadContent('pages/home', (err, data) => {
      if (err.code) {
        hilog.error(0x0000, 'testTag', 'Failed to load the content. Cause: %{public}s', JSON.stringify(err) ?? '');
        return;
      }
      hilog.info(0x0000, 'testTag', 'Succeeded in loading the content. Data: %{public}s', JSON.stringify(data) ?? '');
    });
  }

  onWindowStageDestroy() {
    // Main window is destroyed, release UI related resources
    hilog.info(0x0000, 'testTag', '%{public}s', 'Ability onWindowStageDestroy');
  }

  onForeground() {
    // Ability has brought to foreground
    hilog.info(0x0000, 'testTag', '%{public}s', 'Ability onForeground');
  }

  onBackground() {
    // Ability has back to background
    hilog.info(0x0000, 'testTag', '%{public}s', 'Ability onBackground');
  }
}
