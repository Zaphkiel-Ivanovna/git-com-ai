export interface IOllamaModelDetails {
  format: string;
  family: string;
  families: string[] | null;
  parameter_size: string;
  quantization_level: string;
}

export interface IOllamaModel {
  name: string;
  modified_at: string;
  size: number;
  digest: string;
  details: IOllamaModelDetails;
}

export interface IOllamaTagsResponse {
  models: IOllamaModel[];
}
