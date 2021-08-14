// DreamTime.
// Copyright (C) DreamNet. All rights reserved.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License 3.0 as published by
// the Free Software Foundation. See <https://www.gnu.org/licenses/gpl-3.0.html>
//
// Written by Ivan Bravo Bravo <ivan@opendreamnet.com>, 2019.

export function closestNumber(n, m = 16) {
  // Find the quotient
  const q = parseInt(n / m, 10)

  // 1st possible closest number
  const n1 = m * q
  let n2

  // 2nd possible closest number
  if ((n * m) > 0) {
    n2 = (m * (q + 1))
  } else {
    n2 = (m * (q - 1))
  }

  // if true, then n1 is the required closest number
  if (Math.abs(n - n1) < Math.abs(n - n2)) {
    return n1
  }

  // else n2 is the required closest number
  return n2
}
