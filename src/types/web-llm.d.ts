declare module '@mlc-ai/web-llm' {
  export function CreateMLCEngine(model: string, options?: any): Promise<any>;
  export function hasModelInCache(modelId: string, appConfig?: any): Promise<boolean>;
  export function deleteModelAllInfoInCache(modelId: string, appConfig?: any): Promise<void>;
  export function deleteModelInCache(modelId: string, appConfig?: any): Promise<void>;
  export const prebuiltAppConfig: {
    model_list: Array<{
      model: string;
      model_id: string;
      model_lib: string;
      vram_required_MB?: number;
      low_resource_required?: boolean;
    }>;
  };
}
