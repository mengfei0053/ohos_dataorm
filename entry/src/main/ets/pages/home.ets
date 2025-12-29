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

import router from '@ohos.router';

@Entry
@Component
struct Home {
  build() {
    Flex({ direction: FlexDirection.Column,
      alignItems: ItemAlign.Center,
      justifyContent: FlexAlign.Center }) {
      Button('dataORM')
        .fontSize(20)
        .fontWeight(FontWeight.Bold).onClick(() => {
        router.pushUrl({ url: 'pages/Index' })
      })
      Button('extends')
        .fontSize(20)
        .margin({ top: 20 })
        .fontWeight(FontWeight.Bold)
        .onClick(() => {
        router.pushUrl({ url: 'pages/ExtendsPage' })
      })
      Button('upgrade')
        .fontSize(20)
        .margin({ top: 20 })
        .fontWeight(FontWeight.Bold)
        .onClick(() => {
          router.pushUrl({ url: 'pages/upgrade' })
        })
      Button('annotation')
        .fontSize(20).margin({ top: 20 }).fontWeight(FontWeight.Bold).onClick(() => {
        router.pushUrl({ url: "pages/annotation" })
      })
      Button('sync api')
        .fontSize(20).margin({ top: 20 }).fontWeight(FontWeight.Bold).onClick(() => {
        router.pushUrl({ url: "pages/SyncApi" })
      })
      Button('SavePage')
        .fontSize(20).margin({ top: 20 }).fontWeight(FontWeight.Bold).onClick(() => {
        router.pushUrl({ url: "pages/SavePage" })
      })
      Button($r('app.string.Composite_Primary_Key'))
        .fontSize(20).margin({ top: 20 }).fontWeight(FontWeight.Bold).onClick(() => {
        router.pushUrl({ url: "pages/CompositePrimaryKey" })
      })
      Button($r('app.string.Compound_Index'))
        .fontSize(20).margin({ top: 20 }).fontWeight(FontWeight.Bold).onClick(() => {
        router.pushUrl({ url: "pages/UnionPrimaryKey" })
      })
      Button($r('app.string.Data_nesting'))
        .fontSize(20).margin({ top: 20 }).fontWeight(FontWeight.Bold).onClick(() => {
        router.pushUrl({ url: "pages/EmbedPage" })
      })
      Button('Convert')
        .fontSize(20).margin({ top: 20 }).fontWeight(FontWeight.Bold).onClick(() => {
        router.pushUrl({ url: "pages/ConvertPage" })
      })
      Button($r('app.string.Batch_insertion_or_update'))
        .fontSize(20).margin({ top: 20 }).fontWeight(FontWeight.Bold).onClick(() => {
        router.pushUrl({ url: "pages/InsertPage" })
      })
      Button($r('app.string.Customize_database_path'))
        .fontSize(20).margin({ top: 20 }).fontWeight(FontWeight.Bold).onClick(() => {
        router.pushUrl({ url: "pages/customDir" })
      })
      Button($r('app.string.Multiple_database'))
        .fontSize(20).margin({ top: 20 }).fontWeight(FontWeight.Bold).onClick(() => {
        router.pushUrl({ url: "pages/MuktiDataViewlibrary" })
      })
      Button($r('app.string.observed_btn_text'))
        .fontSize(20).margin({ top: 20 }).fontWeight(FontWeight.Bold).onClick(() => {
        router.pushUrl({ url: "pages/ObservedAndDataPage" })
      })
    }
    .width('100%')
    .height('100%')
  }
}