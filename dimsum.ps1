# Dim Sum

function Bilateral {
    param (
        [Parameter(Mandatory=$true, Position=0)]
        [Decimal]$Nominal,
        [Parameter(Mandatory=$true, Position=1)]
        [Decimal]$PlusTol,
        [Parameter(Mandatory=$true, Position=2)]
        [Decimal]$MinusTol
    )
    $($Nominal + $MinusTol), $($Nominal + $PlusTol)
}

Bilateral 1.000 +0.010 -0.020
Bilateral 2.125 +0.010 -0.020
