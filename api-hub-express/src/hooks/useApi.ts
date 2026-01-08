import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  API,
  APISummary,
  Category,
  Documentation,
  PaginatedResponse,
  PricingPlan,
  APIReleaseInput,
  SubscriptionCheckout,
  SubscriptionPlan,
  apiService,
  getErrorMessage,
  SessionResponse,
  User,
  UserProfile,
} from "@/lib/api";

interface QueryBootstrapOptions<T> {
  initialData?: T;
}


export const useSession = () =>
  useQuery({
    queryKey: ["session"],
    queryFn: () => apiService.getSession(),
    retry: false,
  });

export const useSocialAuthProviders = () =>
  useQuery({
    queryKey: ["social-auth-providers"],
    queryFn: () => apiService.getSocialAuthProviders(),
    staleTime: 5 * 60 * 1000,
  });


export const useCategories = (page?: number, options?: QueryBootstrapOptions<PaginatedResponse<Category>>) =>
  useQuery({
    queryKey: ["categories", page],
    queryFn: () => apiService.getCategories(page),
    initialData: options?.initialData,
  });


export const useCategory = (slug: string | undefined) =>
  useQuery({
    queryKey: ["category", slug],
    queryFn: () => apiService.getCategory(slug as string),
    enabled: Boolean(slug),
  });


export const useCategoryApis = (slug: string | undefined, page?: number) =>
  useQuery({
    queryKey: ["category", slug, "apis", page],
    queryFn: () => apiService.getCategoryApis(slug as string, page),
    enabled: Boolean(slug),
  });


export const useAPIs = (params?: {
  search?: string;
  category?: string;
  featured?: boolean;
  popular?: boolean;
  owned?: boolean;
  ordering?: string;
  page?: number;
  page_size?: number;
  tag?: string;
}, options?: QueryBootstrapOptions<PaginatedResponse<APISummary>>) =>
  useQuery({
    queryKey: ["apis", params],
    queryFn: () => apiService.getAPIs(params),
    initialData: options?.initialData,
  });


export const useAPI = (slug: string | undefined, options?: QueryBootstrapOptions<API>) =>
  useQuery({
    queryKey: ["api", slug],
    queryFn: () => apiService.getAPI(slug as string),
    enabled: Boolean(slug),
    initialData: options?.initialData,
  });


export const useSimilarAPIs = (slug: string | undefined, options?: QueryBootstrapOptions<APISummary[]>) =>
  useQuery({
    queryKey: ["api", slug, "similar"],
    queryFn: () => apiService.getSimilarAPIs(slug as string),
    enabled: Boolean(slug),
    initialData: options?.initialData,
  });


export const useRateAPI = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ slug, rating }: { slug: string; rating: number }) => apiService.rateAPI(slug, rating),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["api", variables.slug] });
      queryClient.invalidateQueries({ queryKey: ["apis"] });
      toast.success("امتیاز شما با موفقیت ثبت شد.");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "ثبت امتیاز انجام نشد."));
    },
  });
};


export const useReleaseAPI = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: APIReleaseInput) => apiService.releaseAPI(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["apis"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.setQueryData(["api", data.api.slug], data.api);
      toast.success(data.message);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "انتشار API انجام نشد."));
    },
  });
};


export const usePricingPlans = (
  apiSlug?: string,
  page?: number,
  options?: QueryBootstrapOptions<PaginatedResponse<PricingPlan>>,
) =>
  useQuery({
    queryKey: ["pricing-plans", apiSlug, page],
    queryFn: () => apiService.getPricingPlans(apiSlug, page),
    initialData: options?.initialData,
  });


export const useSubscriptionPlans = (options?: QueryBootstrapOptions<PaginatedResponse<SubscriptionPlan>>) =>
  useQuery({
    queryKey: ["subscription-plans"],
    queryFn: () => apiService.getSubscriptionPlans(),
    initialData: options?.initialData,
  });


export const useCurrentSubscription = () => {
  const session = useSession();
  return useQuery({
    queryKey: ["subscription"],
    queryFn: () => apiService.getCurrentSubscription(),
    enabled: session.data?.authenticated === true,
    retry: false,
  });
};


export const useSubscribe = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (planId: number) => {
      const checkout = await apiService.subscribe(planId);
      return apiService.confirmSubscriptionCheckout(checkout.checkout.id);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["subscription"], { subscription: data.subscription });
      queryClient.invalidateQueries({ queryKey: ["access-grants"] });
      toast.success(data.message);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "فعال‌سازی اشتراک انجام نشد."));
    },
  });
};


export const useCreateSubscriptionCheckout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (planId: number) => apiService.subscribe(planId),
    onSuccess: (data) => {
      queryClient.setQueryData(["subscription-checkout", data.checkout.id], { checkout: data.checkout });
      toast.success(data.message);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "ایجاد پرداخت اشتراک انجام نشد."));
    },
  });
};


export const useSubscriptionCheckout = (checkoutId: number | undefined, initialCheckout?: SubscriptionCheckout | null) =>
  useQuery({
    queryKey: ["subscription-checkout", checkoutId],
    queryFn: () => apiService.getSubscriptionCheckout(checkoutId as number),
    enabled: Boolean(checkoutId),
    initialData: initialCheckout ? { checkout: initialCheckout } : undefined,
    retry: false,
  });


export const useConfirmSubscriptionCheckout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (checkoutId: number) => apiService.confirmSubscriptionCheckout(checkoutId),
    onSuccess: (data) => {
      queryClient.setQueryData(["subscription"], { subscription: data.subscription });
      queryClient.setQueryData(["subscription-checkout", data.checkout.id], { checkout: data.checkout });
      queryClient.invalidateQueries({ queryKey: ["access-grants"] });
      toast.success(data.message);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "تایید پرداخت اشتراک انجام نشد."));
    },
  });
};


export const useCancelSubscriptionCheckout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (checkoutId: number) => apiService.cancelSubscriptionCheckout(checkoutId),
    onSuccess: (data) => {
      queryClient.setQueryData(["subscription-checkout", data.checkout.id], { checkout: data.checkout });
      toast.success(data.message);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "لغو پرداخت اشتراک انجام نشد."));
    },
  });
};


export const useDocumentations = (
  apiSlug?: string,
  page?: number,
  options?: QueryBootstrapOptions<PaginatedResponse<Documentation>>,
) =>
  useQuery({
    queryKey: ["documentations", apiSlug, page],
    queryFn: () => apiService.getDocumentations(apiSlug, page),
    initialData: options?.initialData,
  });


function syncSessionCache(queryClient: ReturnType<typeof useQueryClient>, session: SessionResponse) {
  queryClient.setQueryData(["session"], session);
  queryClient.setQueryData(["user", "current"], session.user);
  queryClient.setQueryData(["profile"], session.profile);
}


export const useLogin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ username, password }: { username: string; password: string }) => apiService.login(username, password),
    onSuccess: (data) => {
      syncSessionCache(queryClient, data);
      toast.success(data.message);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "ورود انجام نشد."));
    },
  });
};


export const useRegister = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      username: string;
      email?: string;
      password: string;
      password_confirm: string;
      first_name?: string;
      last_name?: string;
    }) => apiService.register(data),
    onSuccess: (data) => {
      syncSessionCache(queryClient, data);
      toast.success(data.message);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "ثبت‌نام انجام نشد."));
    },
  });
};


export const useLogout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiService.logout(),
    onSuccess: (data) => {
      syncSessionCache(queryClient, { authenticated: data.authenticated, user: null, profile: null });
      queryClient.removeQueries({ queryKey: ["access-grants"] });
      queryClient.removeQueries({ queryKey: ["usage"] });
      toast.success(data.message);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "خروج انجام نشد."));
    },
  });
};


export const useCurrentUser = () => {
  const session = useSession();
  return {
    ...session,
    data: session.data?.user ?? null,
  } as typeof session & { data: User | null };
};


export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { email?: string; first_name?: string; last_name?: string }) => apiService.updateUser(data),
    onSuccess: (data) => {
      queryClient.setQueryData(["user", "current"], data.user);
      queryClient.setQueryData(["session"], (current: SessionResponse | undefined) =>
        current ? { ...current, user: data.user } : current,
      );
      toast.success(data.message);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "به‌روزرسانی حساب انجام نشد."));
    },
  });
};


export const useProfile = () => {
  const session = useSession();
  return useQuery({
    queryKey: ["profile"],
    queryFn: () => apiService.getProfile(),
    enabled: session.data?.authenticated === true,
    retry: false,
    initialData: session.data?.profile ?? undefined,
  });
};


export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { phone?: string; company?: string; bio?: string; avatar?: string | null }) =>
      apiService.updateProfile(data),
    onSuccess: (data) => {
      queryClient.setQueryData(["profile"], data.profile);
      queryClient.setQueryData(["session"], (current: SessionResponse | undefined) =>
        current ? { ...current, profile: data.profile } : current,
      );
      toast.success(data.message);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "به‌روزرسانی پروفایل انجام نشد."));
    },
  });
};


export const useGenerateLegacyAPIKey = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiService.generateLegacyAPIKey(),
    onSuccess: (data) => {
      queryClient.setQueryData(["profile"], data.profile);
      queryClient.setQueryData(["session"], (current: SessionResponse | undefined) =>
        current ? { ...current, profile: data.profile } : current,
      );
      toast.success(data.message);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "API key rotation failed."));
    },
  });
};


export const useAccessGrants = () => {
  const session = useSession();
  return useQuery({
    queryKey: ["access-grants"],
    queryFn: () => apiService.getAccessGrants(),
    enabled: session.data?.authenticated === true,
    retry: false,
  });
};


export const useUsage = (page?: number) => {
  const session = useSession();
  return useQuery({
    queryKey: ["usage", page],
    queryFn: () => apiService.getUsage(page),
    enabled: session.data?.authenticated === true,
  });
};


export const useUsageStats = () => {
  const session = useSession();
  return useQuery({
    queryKey: ["usage", "stats"],
    queryFn: () => apiService.getUsageStats(),
    enabled: session.data?.authenticated === true,
  });
};
