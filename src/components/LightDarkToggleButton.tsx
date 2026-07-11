"use client"

import type { IconButtonProps } from "@chakra-ui/react"
import { ClientOnly, IconButton, Skeleton } from "@chakra-ui/react"
import { forwardRef } from "react"
import { useTheme } from "next-themes"
import { LuMoon, LuSun } from "react-icons/lu"

type LightDarkToggleButtonProps = Omit<IconButtonProps, "aria-label"> & {
	"aria-label"?: string
}

export const LightDarkToggleButton = forwardRef<
	HTMLButtonElement,
	LightDarkToggleButtonProps
>(function LightDarkToggleButton(props, ref) {
	const { resolvedTheme, setTheme } = useTheme()
	const colorMode = resolvedTheme === "dark" ? "dark" : "light"
	const toggleColorMode = () => {
		setTheme(colorMode === "dark" ? "light" : "dark")
	}
	const IconComponent = colorMode === "dark" ? LuMoon : LuSun

	return (
		<ClientOnly fallback={<Skeleton boxSize="8" />}>
			<IconButton
				ref={ref}
				onClick={toggleColorMode}
				variant="ghost"
				aria-label={props["aria-label"] ?? "Toggle color mode"}
				size="sm"
				{...props}
				css={{
					_icon: {
						width: "5",
						height: "5",
					},
				}}
			>
				<IconComponent />
			</IconButton>
		</ClientOnly>
	)
})

export default LightDarkToggleButton