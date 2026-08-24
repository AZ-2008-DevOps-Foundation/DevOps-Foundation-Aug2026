targetScope = 'resourceGroup'

@description('Prefix for all resource names.')
@minLength(3)
@maxLength(12)
param namePrefix string = 'weather'

@description('Azure region for all resources.')
param location string = resourceGroup().location

@description('Object ID of the CI/CD service principal. Leave empty to skip deployer RBAC.')
param deployerPrincipalId string = ''

var suffix = uniqueString(resourceGroup().id)

resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: '${namePrefix}-law'
  location: location
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30
  }
}

resource containerAppsEnvironment 'Microsoft.App/managedEnvironments@2024-03-01' = {
  name: '${namePrefix}-env'
  location: location
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logAnalytics.properties.customerId
        sharedKey: logAnalytics.listKeys().primarySharedKey
      }
    }
  }
}

// Least-privilege role for the pipeline: deploy/update the two Container Apps, nothing else.
resource deployerRole 'Microsoft.Authorization/roleDefinitions@2022-04-01' = if (!empty(deployerPrincipalId)) {
  name: guid(resourceGroup().id, 'container-apps-deployer')
  properties: {
    roleName: '${namePrefix} Container Apps Deployer (${suffix})'
    description: 'Deploy and update the weather Container Apps from CI/CD.'
    type: 'CustomRole'
    assignableScopes: [
      resourceGroup().id
    ]
    permissions: [
      {
        actions: [
          'Microsoft.Resources/subscriptions/resourceGroups/read'
          'Microsoft.Resources/deployments/read'
          'Microsoft.Resources/deployments/write'
          'Microsoft.Resources/deployments/validate/action'
          'Microsoft.Resources/deployments/operations/read'
          'Microsoft.Resources/deployments/operationstatuses/read'
          'Microsoft.App/containerApps/read'
          'Microsoft.App/containerApps/write'
          'Microsoft.App/containerApps/revisions/read'
          'Microsoft.App/containerApps/revisions/restart/action'
          'Microsoft.App/managedEnvironments/read'
          'Microsoft.App/managedEnvironments/join/action'
        ]
        notActions: []
        dataActions: []
        notDataActions: []
      }
    ]
  }
}

resource deployerRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = if (!empty(deployerPrincipalId)) {
  name: guid(resourceGroup().id, deployerPrincipalId, 'container-apps-deployer')
  properties: {
    roleDefinitionId: deployerRole.id
    principalId: deployerPrincipalId
    principalType: 'ServicePrincipal'
  }
}

output environmentName string = containerAppsEnvironment.name
output logAnalyticsWorkspaceName string = logAnalytics.name
