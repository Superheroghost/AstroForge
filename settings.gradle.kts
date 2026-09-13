pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "AstroForge"
include(
    ":app",
    ":core:math",
    ":core:engine",
    ":core:offline",
    ":domain:model",
    ":domain:usecase",
    ":data",
    ":feature:game",
)
