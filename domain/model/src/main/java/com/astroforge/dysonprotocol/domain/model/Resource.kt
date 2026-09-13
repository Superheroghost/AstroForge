package com.astroforge.dysonprotocol.domain.model

enum class ResourceType {
    ORE,
    ALLOY,
    ENERGY,
    QUARKS,
}

data class Resource(
    val type: ResourceType,
    val amount: com.astroforge.dysonprotocol.core.math.BigNumber,
)
