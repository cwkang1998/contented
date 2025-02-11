export class PipelineCollectionNotFoundException extends Error {
  constructor(pipelineName){
    super(`Pipeline type '${pipelineName}' cannot resolve its collection. Please check if contented.config.js is properly configured.`)
  }
}