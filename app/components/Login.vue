<template>
    <form @submit.prevent="login" v-if="!loggedIn" class="flex flex-col gap-1">
        <UInput type="email" v-model="credentials.email" :name="'email'" placeholder="E-mail" autofocus autocomplete="on" />
        <p v-if="isTokenRequested" class="px-2 mb-3 -mt-1">
            <small class="text-muted">Check your email for the login token</small>
        </p>
        <UPinInput v-if="isTokenRequested" ref="tokenInput" v-model="credentials.token" otp length="4"
            class="mx-auto mb-1" />
        <UButton type="submit" trailing-icon="i-lucide-log-in" class="justify-center"
            :class="{ 'w-fit mx-auto': credentials.token.length === 4 }"
            v-if="(!isTokenRequested && credentials.email) || (credentials.token.length === 4)">
            Login
        </UButton>
    </form>
</template>

<script setup>
const { loggedIn, fetch: refreshSession } = useUserSession();
const router = useRouter();
const toast = useToast();

const credentials = reactive({
    email: '',
    token: [],
});

watch(() => credentials.email, () => {
    isTokenRequested.value = false;
    credentials.token = [];
});

const tokenInput = ref(null);

const isTokenRequested = ref(false);

async function login() {
    if (!isTokenRequested.value) {
        try {
            await $fetch('/api/auth/token', {
                method: 'POST',
                body: { email: credentials.email },
            });

            isTokenRequested.value = true;
            await nextTick();
            tokenInput.value.inputsRef[0].$el.focus();

        } catch (error) {
            toast.add({
                title: 'Error',
                description: error.statusMessage || 'Error requesting token',
                color: 'error',
            });
        };
    } else {
        try {
            await $fetch('/api/auth/login', {
                method: 'POST',
                body: { email: credentials.email, token: credentials.token.join('') },
            });

            router.push('/');
            refreshSession();
            credentials.email = '';
            credentials.token = [];
            isTokenRequested.value = false;
        } catch (error) {
            toast.add({
                title: 'Error',
                description: error.statusMessage || 'Bad credentials',
                color: 'error',
            });
        };
    };
};
</script>