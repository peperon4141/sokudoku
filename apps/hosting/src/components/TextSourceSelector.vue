<template>
  <Card class="max-w-6xl w-full">
    <template #title>テキストソースを選択</template>
    <template #content>
      <div class="flex flex-col gap-4">
        <Tabs v-model:value="activeTabIndex">
          <TabList>
            <Tab v-if="showTextTabs" header="サンプル文章" value="0" />
            <Tab v-if="showTextTabs" header="テキスト入力" value="1" />
            <Tab v-if="showTextTabs" header="ファイルアップロード" value="2" />
            <Tab v-if="showWordTabs" header="単語リスト" value="3" />
          </TabList>

          <TabPanel v-if="showTextTabs" value="0">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
              <Button
                v-for="source in sampleTexts"
                :key="source.id"
                :label="source.name"
                severity="primary"
                class="justify-start"
                @click="selectSource(source)"
              >
                <template #icon>
                  <i class="pi pi-file mr-2"></i>
                </template>
              </Button>
            </div>
          </TabPanel>

          <TabPanel v-if="showTextTabs" value="1">
            <div class="mt-4">
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div class="md:col-span-1">
                  <label class="block mb-2 font-medium">タイトル</label>
                  <InputText
                    v-model="customTitle"
                    placeholder="例: 読書メモ"
                    class="w-full"
                  />
                </div>
                <div class="md:col-span-2">
                  <label class="block mb-2 font-medium">テキスト</label>
                  <Textarea
                    v-model="customText"
                    :rows="12"
                    placeholder="ここにテキストを入力してください..."
                    class="w-full text-base"
                  />
                </div>
              </div>
              <Button
                label="使用する"
                severity="primary"
                :disabled="!customText || customText.trim().length === 0"
                @click="useCustomText"
              />
            </div>
          </TabPanel>

          <TabPanel v-if="showTextTabs" value="2">
            <div class="mt-4">
              <FileUpload
                mode="basic"
                accept=".txt"
                :maxFileSize="10000000"
                chooseLabel="ファイルを選択"
                @select="onFileSelect"
                class="mb-4"
              />
              <div v-if="uploadedFileName" class="text-sm text-surface-600">
                選択中: {{ uploadedFileName }}
              </div>
            </div>
          </TabPanel>

          <TabPanel v-if="showWordTabs" value="3">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
              <Button
                v-for="wordList in wordLists"
                :key="wordList.id"
                :label="wordList.name"
                severity="secondary"
                outlined
                class="justify-start"
                @click="selectWordList(wordList.id)"
              >
                <template #icon>
                  <i class="pi pi-list mr-2"></i>
                </template>
              </Button>
            </div>
          </TabPanel>
        </Tabs>

        <Button
          label="キャンセル"
          severity="secondary"
          outlined
          class="w-full mt-4"
          @click="$emit('cancel')"
        />
      </div>
    </template>
  </Card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import Card from 'primevue/card'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import FileUpload from 'primevue/fileupload'
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanel from 'primevue/tabpanel'
import { useTextContent, type TextSource } from '@/composables/useTextContent'
import { wordLists } from '@/composables/useWords'

interface Props {
  mode?: 'words' | 'text' | 'both'
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'both'
})

const emit = defineEmits<{
  select: [source: TextSource | { id: string; type: 'words' }]
  cancel: []
}>()

const { getAvailableSources, createCustomSource } = useTextContent()
const sampleTexts = getAvailableSources()
const activeTabIndex = ref('0')
const customTitle = ref('')
const customText = ref('')
const uploadedFileName = ref('')

// モードに応じて表示するタブを制御
const showTextTabs = computed(() => props.mode === 'text' || props.mode === 'both')
const showWordTabs = computed(() => props.mode === 'words' || props.mode === 'both')

// 初期タブを設定
const initialTab = computed(() => {
  if (props.mode === 'words') return '3'
  if (props.mode === 'text') return '0'
  return '0'
})

// アクティブなタブを初期化
activeTabIndex.value = initialTab.value

const selectSource = (source: TextSource) => {
  emit('select', source)
}

const useCustomText = () => {
  if (!customText.value || customText.value.trim().length === 0) return
  
  const source = createCustomSource(
    customTitle.value || 'カスタムテキスト',
    customText.value
  )
  emit('select', source)
}

const onFileSelect = (event: any) => {
  const file = event.files[0]
  if (!file) return
  
  uploadedFileName.value = file.name
  
  const reader = new FileReader()
  reader.onload = (e) => {
    const text = e.target?.result as string
    if (text) {
      const source = createCustomSource(file.name.replace(/\.[^/.]+$/, ''), text)
      emit('select', source)
    }
  }
  reader.readAsText(file)
}

const selectWordList = (wordListId: string) => {
  emit('select', { id: wordListId, type: 'words' })
}
</script>

