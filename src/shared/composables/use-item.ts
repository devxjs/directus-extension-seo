import { Ref, computed, onMounted, ref } from "vue"
import { useApi, useStores } from "@directus/composables"
import merge from 'lodash/merge'
import useLanguage from "./use-languages"
import { COLLECTION } from "../constants"

export default function useItem(collection: string = '', key: string = '', isMultilang: boolean = true, defaultValue: any = {}) {
    const { useNotificationsStore } = useStores()
    const notify = useNotificationsStore()
    
    const settings = ref(defaultValue)
    const item = ref(defaultValue)
    const isNew = ref(false)
    const loading = ref(false)
    const saving = ref(false)
    const error = ref()
    
    const { currentLanguage, languages } = useLanguage()
    
    const itemLang = computed(() => {
        return (isMultilang && currentLanguage.value) ? item.value?.[currentLanguage.value] : item.value
    })
    
    const editData = computed({
        get: () => isMultilang ? settings.value?.[currentLanguage.value] : settings.value,
        set: (newValue) => {
            if (isMultilang) {
                
                settings.value[currentLanguage.value] = newValue
                return
            }

            settings.value = newValue
        },
    })

    const api = useApi()
    const endPoint = `/items/${collection}`

    const saveData = computed(() => (collection === COLLECTION.seo_setting ? {
        value: merge(item.value, settings.value)
    } : merge(item.value, settings.value)))

    async function getItem() {
        loading.value = true;
		error.value = null;

		try {
			const response = await api.get(`${endPoint}/${key}`, {params: {fields: ['*.*']}});
            item.value = response?.data?.data?.value;
		} catch (err: any) {
			error.value = err;
            isNew.value = true
		} finally {
			loading.value = false;
		}
    }

    async function save(data: any = {}) {
        saving.value = true;

        try {
			let response;

			if (isNew.value === true) {
				response = await api.post(endPoint, {key, ...saveData.value, ...data});

			} else {
				response = await api.patch(`${endPoint}/${key}`, {...saveData.value, ...data});
                isNew.value = false
			}
            notify.add({
                type: 'success',
                title: 'Saved Successfully!'
            })

			settings.value = defaultValue;
			return response.data.data;
		} catch (err: any) {
			// saveErrorHandler(err);
            console.log(error)
            notify.add({
                type: 'error',
                title: 'Save Error'
            })
		} finally {
			saving.value = false;
		}
    }

    onMounted(async () => {
        await getItem()
    })

    return {
        settings,
        item,
        itemLang,
        editData,
        saveData,
        currentLanguage,
        languages,
        saving,
        loading,
        error,
        getItem,
        save,
    }
}