# SPDX-FileCopyrightText: 2026 Cyrenet OS Contributors
# SPDX-License-Identifier: GPL-3.0-only

include $(TOPDIR)/rules.mk

LUCI_TITLE:=Cyrenet OS Dashboard & UI Runtime
LUCI_DEPENDS:=+luci-base
LUCI_PKGARCH:=all
PKG_LICENSE:=GPL-3.0-only

define Build/Compile
	test -f "$(CURDIR)/htdocs/luci-static/resources/cyrenet/manifest.json" || \
		(echo "Missing synced Cyrenet UI static assets; run scripts/build/build-ui.sh first." >&2; exit 1)
endef

include $(TOPDIR)/feeds/luci/luci.mk

# call BuildPackage - OpenWrt buildroot signature
